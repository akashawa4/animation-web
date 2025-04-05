// Variables for effects
let currentEffect = 'normal';
let bodyPixModel = null;
let backgroundImage = new Image();
let isBackgroundLoaded = false;

// PoseNet model and variables
let poseNetModel = null;
let currentPose = null;
let animationFrameCount = 0;
let particleEffects = [];
let avatarMode = false;

// Initialize BodyPix model
async function initBodyPix() {
    try {
        bodyPixModel = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
        console.log('BodyPix model loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading BodyPix model:', error);
        return false;
    }
}

// Initialize PoseNet model
async function initPoseNet() {
    try {
        poseNetModel = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75
        });
        console.log('PoseNet model loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading PoseNet model:', error);
        return false;
    }
}

// Load background image
function loadBackgroundImage(url) {
    return new Promise((resolve, reject) => {
        backgroundImage.onload = () => {
            isBackgroundLoaded = true;
            resolve(true);
        };
        backgroundImage.onerror = (error) => {
            console.error('Error loading background image:', error);
            reject(error);
        };
        backgroundImage.src = url;
    });
}

// Detect pose in the current frame
async function detectPose(video) {
    if (!poseNetModel || !video) return null;
    
    try {
        const pose = await poseNetModel.estimateSinglePose(video, {
            flipHorizontal: true
        });
        
        // Only update if confidence is high enough
        if (pose.score > 0.2) {
            currentPose = pose;
        }
        
        return pose;
    } catch (error) {
        console.error('Error detecting pose:', error);
        return null;
    }
}

// Enhanced applyBackgroundReplacement function with pose detection
async function applyBackgroundReplacement(inputCanvas, outputCanvas, video) {
    if (!bodyPixModel) {
        console.warn("BodyPix model not loaded yet. Retrying initialization...");
        const modelLoaded = await initBodyPix();
        if (!modelLoaded) {
            console.error("Failed to load BodyPix model after retry");
            return;
        }
    }
    
    if (!isBackgroundLoaded) {
        console.warn("Background image not loaded yet");
        return;
    }
    
    // Detect pose if PoseNet is loaded
    if (poseNetModel) {
        await detectPose(video);
    }
    
    const segmentation = await bodyPixModel.segmentPerson(video, {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: 0.7
    });
    
    const outputContext = outputCanvas.getContext('2d');
    
    // Draw background image
    outputContext.drawImage(
        backgroundImage, 
        0, 0, 
        outputCanvas.width, outputCanvas.height
    );
    
    // Draw the person
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const personMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
    
    // Draw the mask onto the input canvas
    const inputContext = inputCanvas.getContext('2d');
    inputContext.putImageData(personMask, 0, 0);
    
    // Draw the video onto the output canvas using the mask
    outputContext.save();
    outputContext.globalCompositeOperation = 'destination-out';
    outputContext.drawImage(inputCanvas, 0, 0, outputCanvas.width, outputCanvas.height);
    outputContext.restore();
    
    // Draw the person from the video
    outputContext.globalCompositeOperation = 'source-over';
    outputContext.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
    
    // Apply selected effect
    applyEffect(outputContext, outputCanvas.width, outputCanvas.height);
    
    // Apply pose-based animations if pose is detected
    if (currentPose && (currentEffect === 'avatar' || avatarMode)) {
        applyPoseAnimations(outputContext, outputCanvas.width, outputCanvas.height);
    }
}

// Enhanced applyEffect function with new effects
// Update the applyEffect function to include anime effect
function applyEffect(ctx, width, height) {
    animationFrameCount++;
    
    // Check if cartoon effect is active from the module
    if (window.cartoonEffectModule && window.cartoonEffectModule.isCartoonEffectActive) {
        window.cartoonEffectModule.applyCartoonEffect(ctx, width, height);
        return; // Exit early to avoid applying other effects
    }
    
    // Apply other effects based on currentEffect
    switch (currentEffect) {
        case 'cartoon':
            // This is now handled by the cartoon-effect.js module
            break;
        case 'neon':
            applyNeonEffect(ctx, width, height);
            break;
        case 'pixelate':
            applyPixelateEffect(ctx, width, height);
            break;
        case 'avatar':
            applyAvatarEffect(ctx, width, height);
            break;
        case 'glitch':
            applyGlitchEffect(ctx, width, height);
            break;
        case 'rainbow':
            applyRainbowEffect(ctx, width, height);
            break;
        case 'anime':
            // No real-time effect - this will be applied on capture
            // Just add a subtle indicator that anime effect is selected
            applyAnimeEffectIndicator(ctx, width, height);
            break;
        case 'normal':
        default:
            // No effect applied
            break;
    }
}

// Apply bilateral filtering for smooth areas while preserving edges
function applyBilateralFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const radius = 3;
    const sigma = 0.5;
    
    // Create a copy of the data for processing
    const output = new Uint8ClampedArray(data);
    
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const idx = (y * width + x) * 4;
            
            // Skip transparent pixels
            if (data[idx + 3] === 0) continue;
            
            let sumR = 0, sumG = 0, sumB = 0;
            let weightSum = 0;
            
            // Apply bilateral filter
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const idxK = ((y + ky) * width + (x + kx)) * 4;
                    
                    // Skip transparent pixels
                    if (data[idxK + 3] === 0) continue;
                    
                    // Calculate spatial and range weights
                    const spatialWeight = Math.exp(-(kx * kx + ky * ky) / (2 * sigma * sigma));
                    const rangeWeight = Math.exp(-(
                        Math.pow(data[idx] - data[idxK], 2) +
                        Math.pow(data[idx + 1] - data[idxK + 1], 2) +
                        Math.pow(data[idx + 2] - data[idxK + 2], 2)
                    ) / (2 * sigma * sigma));
                    
                    const weight = spatialWeight * rangeWeight;
                    
                    sumR += data[idxK] * weight;
                    sumG += data[idxK + 1] * weight;
                    sumB += data[idxK + 2] * weight;
                    weightSum += weight;
                }
            }
            
            // Normalize
            if (weightSum > 0) {
                output[idx] = sumR / weightSum;
                output[idx + 1] = sumG / weightSum;
                output[idx + 2] = sumB / weightSum;
            }
        }
    }
    
    // Create new ImageData with the filtered data
    const filteredData = new ImageData(output, width, height);
    ctx.putImageData(filteredData, 0, 0);
}

// Apply artistic edge detection for cartoon outlines
function applyArtisticEdges(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create a new canvas for edge detection
    const edgeCanvas = document.createElement('canvas');
    edgeCanvas.width = width;
    edgeCanvas.height = height;
    const edgeCtx = edgeCanvas.getContext('2d');
    
    // Draw the current canvas content
    edgeCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get the edge data
    const edgeData = edgeCtx.getImageData(0, 0, width, height);
    const edgeDataData = edgeData.data;
    
    // Apply Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Skip transparent pixels
            if (data[idx + 3] === 0) continue;
            
            // Sobel operators
            const gx = (
                -1 * data[((y - 1) * width + (x - 1)) * 4] +
                1 * data[((y - 1) * width + (x + 1)) * 4] +
                -2 * data[(y * width + (x - 1)) * 4] +
                2 * data[(y * width + (x + 1)) * 4] +
                -1 * data[((y + 1) * width + (x - 1)) * 4] +
                1 * data[((y + 1) * width + (x + 1)) * 4]
            ) / 4;
            
            const gy = (
                -1 * data[((y - 1) * width + (x - 1)) * 4] +
                -2 * data[((y - 1) * width + x) * 4] +
                -1 * data[((y - 1) * width + (x + 1)) * 4] +
                1 * data[((y + 1) * width + (x - 1)) * 4] +
                2 * data[((y + 1) * width + x) * 4] +
                1 * data[((y + 1) * width + (x + 1)) * 4]
            ) / 4;
            
            // Calculate magnitude
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            
            // Threshold for edge detection
            if (magnitude > 30) {
                edgeDataData[idx] = 0;
                edgeDataData[idx + 1] = 0;
                edgeDataData[idx + 2] = 0;
                edgeDataData[idx + 3] = 255;
            } else {
                edgeDataData[idx + 3] = 0;
            }
        }
    }
    
    // Put the edge data back
    edgeCtx.putImageData(edgeData, 0, 0);
    
    // Draw the edges on top of the original canvas
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(edgeCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
}

// Apply texture overlay for a more artistic look
function applyTextureOverlay(ctx, width, height) {
    // Create a subtle noise texture
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    // Generate noise
    const noiseData = noiseCtx.createImageData(width, height);
    const noiseDataData = noiseData.data;
    
    for (let i = 0; i < noiseDataData.length; i += 4) {
        // Generate subtle noise
        const noise = Math.random() * 10 - 5;
        
        noiseDataData[i] = noise;
        noiseDataData[i + 1] = noise;
        noiseDataData[i + 2] = noise;
        noiseDataData[i + 3] = 20; // Very subtle opacity
    }
    
    noiseCtx.putImageData(noiseData, 0, 0);
    
    // Apply the noise texture
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
}

// Enhanced neon effect with animation
function applyNeonEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Pulsating intensity based on frame count
    const pulseIntensity = 1.3 + Math.sin(animationFrameCount * 0.05) * 0.3;
    
    for (let i = 0; i < data.length; i += 4) {
        // Skip transparent pixels
        if (data[i + 3] === 0) continue;
        
        // Create neon glow effect
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        if (brightness > 100) {
            // Bright areas get neon colors with pulsating intensity
            data[i] = Math.min(255, data[i] * pulseIntensity);
            data[i + 1] = Math.min(255, data[i + 1] * pulseIntensity);
            data[i + 2] = Math.min(255, data[i + 2] * pulseIntensity);
        } else {
            // Dark areas get darker
            data[i] = data[i] * 0.3;
            data[i + 1] = data[i + 1] * 0.3;
            data[i + 2] = data[i + 2] * 0.3;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add animated glow
    const glowColor = `hsl(${(animationFrameCount * 2) % 360}, 100%, 50%)`;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15 + Math.sin(animationFrameCount * 0.1) * 5;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.shadowBlur = 0;
    
    // Add edge highlight
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Apply pixelate effect
function applyPixelateEffect(ctx, width, height) {
    const pixelSize = 10;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            // Get the color of the first pixel in the block
            const idx = (y * width + x) * 4;
            
            // Skip transparent pixels
            if (data[idx + 3] === 0) continue;
            
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // Apply the color to all pixels in the block
            for (let blockY = 0; blockY < pixelSize && y + blockY < height; blockY++) {
                for (let blockX = 0; blockX < pixelSize && x + blockX < width; blockX++) {
                    const blockIdx = ((y + blockY) * width + (x + blockX)) * 4;
                    
                    // Only apply to non-transparent pixels
                    if (data[blockIdx + 3] !== 0) {
                        data[blockIdx] = r;
                        data[blockIdx + 1] = g;
                        data[blockIdx + 2] = b;
                    }
                }
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// New Avatar effect using PoseNet
function applyAvatarEffect(ctx, width, height) {
    // Set avatar mode to true to enable pose animations
    avatarMode = true;
    
    // Apply a cartoon-like effect as base
    applyCartoonEffect(ctx, width, height);
    
    // Add digital avatar overlay elements if pose is detected
    if (currentPose) {
        // Draw avatar elements based on pose keypoints
        drawAvatarElements(ctx, width, height);
    }
}

// Draw avatar elements based on pose
function drawAvatarElements(ctx, width, height) {
    if (!currentPose) return;
    
    const keypoints = currentPose.keypoints;
    
    // Find key body parts
    const nose = findKeypoint(keypoints, 'nose');
    const leftEye = findKeypoint(keypoints, 'leftEye');
    const rightEye = findKeypoint(keypoints, 'rightEye');
    const leftShoulder = findKeypoint(keypoints, 'leftShoulder');
    const rightShoulder = findKeypoint(keypoints, 'rightShoulder');
    const leftWrist = findKeypoint(keypoints, 'leftWrist');
    const rightWrist = findKeypoint(keypoints, 'rightWrist');
    
    ctx.save();
    
    // Draw fun accessories based on pose
    if (nose && nose.score > 0.7) {
        // Draw animated elements around the head
        drawHeadAccessory(ctx, nose, leftEye, rightEye);
    }
    
    // Draw energy aura based on movement
    if (leftWrist && rightWrist && leftWrist.score > 0.5 && rightWrist.score > 0.5) {
        drawEnergyTrails(ctx, leftWrist, rightWrist);
    }
    
    // Draw tech-themed shoulder pads for INVENTO theme
    if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
        drawTechShoulderPads(ctx, leftShoulder, rightShoulder);
    }
    
    ctx.restore();
}

// Find a specific keypoint in the pose data
function findKeypoint(keypoints, name) {
    return keypoints.find(keypoint => keypoint.part === name);
}

// Draw head accessory (tech crown or halo)
function drawHeadAccessory(ctx, nose, leftEye, rightEye) {
    if (!nose || !leftEye || !rightEye) return;
    
    // Calculate head size and position
    const eyeDistance = Math.sqrt(
        Math.pow(rightEye.position.x - leftEye.position.x, 2) +
        Math.pow(rightEye.position.y - leftEye.position.y, 2)
    );
    
    const headSize = eyeDistance * 3;
    
    // Draw tech crown
    ctx.save();
    ctx.translate(nose.position.x, nose.position.y - headSize * 0.5);
    
    // Animated crown
    const crownHeight = headSize * 0.4;
    const crownWidth = headSize * 1.2;
    
    // Crown base
    ctx.fillStyle = '#00c3ff';
    ctx.beginPath();
    ctx.moveTo(-crownWidth/2, 0);
    ctx.lineTo(crownWidth/2, 0);
    ctx.lineTo(crownWidth/2 + 10, -crownHeight * 0.3);
    ctx.lineTo(crownWidth/3, -crownHeight * 0.5);
    ctx.lineTo(crownWidth/6, -crownHeight);
    ctx.lineTo(-crownWidth/6, -crownHeight);
    ctx.lineTo(-crownWidth/3, -crownHeight * 0.5);
    ctx.lineTo(-crownWidth/2 - 10, -crownHeight * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Crown gems
    const gemColors = ['#ff0066', '#ffcc00', '#00ff99'];
    const gemPositions = [-crownWidth/4, 0, crownWidth/4];
    
    gemPositions.forEach((xPos, i) => {
        ctx.fillStyle = gemColors[i];
        ctx.beginPath();
        ctx.arc(xPos, -crownHeight * 0.6, headSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow to gems
        ctx.shadowColor = gemColors[i];
        ctx.shadowBlur = 10 + Math.sin(animationFrameCount * 0.1 + i) * 5;
        ctx.beginPath();
        ctx.arc(xPos, -crownHeight * 0.6, headSize * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    ctx.restore();
}

// Draw energy trails from hands
function drawEnergyTrails(ctx, leftWrist, rightWrist) {
    // Create particles from wrists if they're moving
    if (!particleEffects.leftWristTrail) {
        particleEffects.leftWristTrail = [];
        particleEffects.rightWristTrail = [];
    }
    
    // Add new particles based on hand position
    if (animationFrameCount % 3 === 0) {
        particleEffects.leftWristTrail.push({
            x: leftWrist.position.x,
            y: leftWrist.position.y,
            size: Math.random() * 10 + 5,
            color: `hsl(${(animationFrameCount * 3) % 360}, 100%, 60%)`,
            life: 20
        });
        
        particleEffects.rightWristTrail.push({
            x: rightWrist.position.x,
            y: rightWrist.position.y,
            size: Math.random() * 10 + 5,
            color: `hsl(${(animationFrameCount * 3 + 180) % 360}, 100%, 60%)`,
            life: 20
        });
    }
    
    // Draw and update particles
    [...particleEffects.leftWristTrail, ...particleEffects.rightWristTrail].forEach((particle, i) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 20;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Update particle
        particle.size *= 0.9;
        particle.life--;
    });
    
    // Remove dead particles
    particleEffects.leftWristTrail = particleEffects.leftWristTrail.filter(p => p.life > 0);
    particleEffects.rightWristTrail = particleEffects.rightWristTrail.filter(p => p.life > 0);
    
    ctx.globalAlpha = 1;
}

// Draw tech-themed shoulder pads
function drawTechShoulderPads(ctx, leftShoulder, rightShoulder) {
    const shoulderWidth = Math.abs(rightShoulder.position.x - leftShoulder.position.x);
    const padSize = shoulderWidth * 0.3;
    
    // Left shoulder pad
    drawTechPad(ctx, leftShoulder.position.x, leftShoulder.position.y, padSize, 'left');
    
    // Right shoulder pad
    drawTechPad(ctx, rightShoulder.position.x, rightShoulder.position.y, padSize, 'right');
}

// Draw individual tech pad
function drawTechPad(ctx, x, y, size, side) {
    const direction = side === 'left' ? -1 : 1;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Base pad
    ctx.fillStyle = '#222233';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(direction * size, -size * 0.3);
    ctx.lineTo(direction * size * 1.2, 0);
    ctx.lineTo(direction * size, size * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Tech lines
    ctx.strokeStyle = '#00c3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(direction * size * 0.8, -size * 0.2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(direction * size * 0.8, size * 0.2);
    ctx.stroke();
    
    // Glowing dot
    const glowIntensity = 0.5 + Math.sin(animationFrameCount * 0.1) * 0.5;
    ctx.fillStyle = `rgba(0, 195, 255, ${glowIntensity})`;
    ctx.beginPath();
    ctx.arc(direction * size * 0.6, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Apply pose-based animations
function applyPoseAnimations(ctx, width, height) {
    if (!currentPose) return;
    
    // Get movement data from pose
    const keypoints = currentPose.keypoints;
    const wrists = [
        findKeypoint(keypoints, 'leftWrist'),
        findKeypoint(keypoints, 'rightWrist')
    ];
    
    // Add particle effects based on movement
    wrists.forEach(wrist => {
        if (wrist && wrist.score > 0.5) {
            // Add particles on fast movement
            if (animationFrameCount % 3 === 0) {
                for (let i = 0; i < 3; i++) {
                    particleEffects.push({
                        x: wrist.position.x,
                        y: wrist.position.y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        size: Math.random() * 15 + 5,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                        life: 30
                    });
                }
            }
        }
    });
    
    // Draw and update particles
    ctx.globalCompositeOperation = 'lighter';
    particleEffects.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.size *= 0.95;
        particle.life--;
    });
    
    // Remove dead particles
    particleEffects = particleEffects.filter(p => p.life > 0);
    
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// New Glitch effect
function applyGlitchEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Only apply glitch effect occasionally
    if (animationFrameCount % 10 === 0) {
        // Create random glitch rectangles
        const numGlitches = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < numGlitches; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const w = Math.floor(Math.random() * 100) + 50;
            const h = Math.floor(Math.random() * 20) + 10;
            
            // Offset the glitch horizontally
            const offset = Math.floor(Math.random() * 30) - 15;
            
            // Copy and shift pixels
            for (let j = 0; j < h; j++) {
                for (let k = 0; k < w; k++) {
                    if (x + k < width && y + j < height && x + k + offset >= 0 && x + k + offset < width) {
                        const sourceIdx = ((y + j) * width + (x + k)) * 4;
                        const targetIdx = ((y + j) * width + (x + k + offset)) * 4;
                        
                        // Skip transparent pixels
                        if (data[sourceIdx + 3] === 0) continue;
                        
                        // Copy pixel with color shift
                        data[targetIdx] = data[sourceIdx] + 50; // R
                        data[targetIdx + 1] = data[sourceIdx + 1]; // G
                        data[targetIdx + 2] = data[sourceIdx + 2] + 50; // B
                        data[targetIdx + 3] = data[sourceIdx + 3]; // A
                    }
                }
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add scan lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
    }
    
    // Add color aberration occasionally
    if (animationFrameCount % 30 < 5) {
        ctx.drawImage(ctx.canvas, -3, 0);
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(ctx.canvas, 3, 0);
        ctx.globalCompositeOperation = 'source-over';
    }
}

// New Rainbow effect
function applyRainbowEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Rainbow color shift based on y-position and time
    for (let i = 0; i < data.length; i += 4) {
        // Skip transparent pixels
        if (data[i + 3] === 0) continue;
        
        // Calculate y position
        const pixelIndex = i / 4;
        const y = Math.floor(pixelIndex / width);
        
        // Create rainbow pattern
        const hue = (y + animationFrameCount) % 360;
        const [r, g, b] = hslToRgb(hue / 360, 0.7, 0.5);
        
        // Mix original color with rainbow
        data[i] = (data[i] * 0.7) + (r * 0.3);
        data[i + 1] = (data[i + 1] * 0.7) + (g * 0.3);
        data[i + 2] = (data[i + 2] * 0.7) + (b * 0.3);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Enhanced sparkle effects
    // Create sparkles at different frequencies for a more dynamic effect
    const mainSparkleFrequency = 5; // Lower number = more frequent sparkles
    const largeSparkleFrequency = 30; // For occasional larger sparkles
    
    // Determine number of sparkles based on canvas size for better distribution
    // but cap it to prevent performance issues
    const areaFactor = (width * height) / 500000; // Normalize for different screen sizes
    const baseSparkleCount = Math.min(Math.floor(200 * areaFactor), 300); // Cap at 300 sparkles
    
    // Add main sparkles
    if (animationFrameCount % mainSparkleFrequency === 0) {
        // Create a grid-based distribution for more even coverage
        const gridCells = Math.sqrt(baseSparkleCount);
        const cellWidth = width / gridCells;
        const cellHeight = height / gridCells;
        
        for (let i = 0; i < baseSparkleCount; i++) {
            // Calculate grid position with some randomness
            const gridX = i % gridCells;
            const gridY = Math.floor(i / gridCells);
            
            // Add randomness within the cell
            const x = (gridX * cellWidth) + (Math.random() * cellWidth);
            const y = (gridY * cellHeight) + (Math.random() * cellHeight);
            
            // Vary size for more natural look
            const size = Math.random() * 3 + 1;
            
            // Vary opacity for depth effect
            const opacity = Math.random() * 0.5 + 0.3;
            
            // Draw the sparkle
            ctx.fillStyle = 'white';
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Add occasional larger sparkles for visual interest
    if (animationFrameCount % largeSparkleFrequency === 0) {
        const largeSparkleCount = Math.floor(baseSparkleCount / 10);
        
        for (let i = 0; i < largeSparkleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 6 + 4; // Larger size
            
            // Create a glow effect for larger sparkles
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a small white center for extra sparkle
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(x, y, size / 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Add twinkling effect (sparkles that fade in and out)
    if (animationFrameCount % 2 === 0) {
        const twinkleCount = Math.floor(baseSparkleCount / 20);
        const twinklePhase = (animationFrameCount / 10) % 1; // Value between 0 and 1
        
        for (let i = 0; i < twinkleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 4 + 2;
            
            // Calculate opacity based on sine wave for smooth fading
            const opacity = Math.sin(twinklePhase * Math.PI) * 0.7 + 0.3;
            
            ctx.fillStyle = 'white';
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Make sure the setupEffectButtons function properly updates the global currentEffect
function setupEffectButtons() {
    const effectButtons = document.querySelectorAll('.effect-btn');
    
    effectButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            effectButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Set current effect
            window.currentEffect = button.dataset.effect;
            console.log('Effect selected:', window.currentEffect);
            
            // Special handling for cartoon effect
            if (window.currentEffect === 'cartoon') {
                // Toggle cartoon effect in the module
                if (window.cartoonEffectModule) {
                    window.cartoonEffectModule.isCartoonEffectActive = true;
                }
            } else {
                // Disable cartoon effect if another effect is selected
                if (window.cartoonEffectModule) {
                    window.cartoonEffectModule.isCartoonEffectActive = false;
                }
            }
            
            // Reset avatar mode if not using avatar effect
            if (window.currentEffect !== 'avatar') {
                avatarMode = false;
            }
        });
    });
}

// Make sure the applyAnimeEffectIndicator function is properly defined
function applyAnimeEffectIndicator(ctx, width, height) {
    // Add a subtle anime-style border to indicate the effect is selected
    ctx.save();
    
    // Create a gradient border
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255, 105, 180, 0.5)'); // Pink
    gradient.addColorStop(0.5, 'rgba(147, 112, 219, 0.5)'); // Purple
    gradient.addColorStop(1, 'rgba(100, 149, 237, 0.5)'); // Cornflower blue
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, width, height);
    
    // Add a small anime icon or text indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Arial';
    ctx.fillText('AnimeGAN effect will be applied on capture', 10, 30);
    
    ctx.restore();
}

// Add a function to process captured image with AnimeGAN
async function processImageWithAnimeGAN(imageDataUrl) {
    if (currentEffect !== 'anime' || !window.animeGanModule) {
        return imageDataUrl; // Return original if not anime effect or module not available
    }
    
    try {
        // Use the AnimeGAN module to transform the image
        const animeImageUrl = await window.animeGanModule.applyAnimeEffect(imageDataUrl);
        return animeImageUrl;
    } catch (error) {
        console.error('Failed to apply anime effect:', error);
        alert('Failed to apply anime effect. Using original image instead.');
        return imageDataUrl; // Return original on error
    }
}

// Export the new function for use in camera.js
window.effectsModule = window.effectsModule || {};
window.effectsModule.processImageWithAnimeGAN = processImageWithAnimeGAN;