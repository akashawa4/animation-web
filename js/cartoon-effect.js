// Cartoon Effect Module

// Variables
let isCartoonEffectActive = false;
let cartoonCanvas = null;
let cartoonCtx = null;

// Initialize cartoon effect
function initCartoonEffect() {
    // Create canvas for cartoon effect
    cartoonCanvas = document.createElement('canvas');
    cartoonCanvas.style.display = 'none';
    document.body.appendChild(cartoonCanvas);
    cartoonCtx = cartoonCanvas.getContext('2d');
    
    // Set up cartoon effect button
    setupCartoonButton();
}

// Set up cartoon effect button
function setupCartoonButton() {
    const effectButtons = document.querySelectorAll('.effect-btn');
    
    effectButtons.forEach(button => {
        if (button.dataset.effect === 'cartoon') {
            button.addEventListener('click', () => {
                // Toggle cartoon effect
                isCartoonEffectActive = !isCartoonEffectActive;
                
                // Update button state
                button.classList.toggle('active');
                
                // Update current effect in the global scope
                if (isCartoonEffectActive) {
                    window.currentEffect = 'cartoon';
                } else {
                    window.currentEffect = 'normal';
                }
                
                // Log for debugging
                console.log('Cartoon effect toggled:', isCartoonEffectActive);
                console.log('Current effect:', window.currentEffect);
            });
        }
    });
}

// Apply cartoon effect to the canvas
function applyCartoonEffect(ctx, width, height) {
    if (!isCartoonEffectActive) return;
    
    // Create a temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the current canvas content to the temporary canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for processing
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply Ghibli-style color simplification
    for (let i = 0; i < data.length; i += 4) {
        // Skip transparent pixels
        if (data[i + 3] === 0) continue;
        
        // Simplify colors (posterize) - more aggressive for Ghibli style
        data[i] = Math.floor(data[i] / 64) * 64;     // Red
        data[i + 1] = Math.floor(data[i + 1] / 64) * 64; // Green
        data[i + 2] = Math.floor(data[i + 2] / 64) * 64; // Blue
        
        // Increase saturation for more vibrant colors
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);
        const lightness = (max + min) / 2;
        
        if (max !== min) {
            const satIncrease = 1.8; // Increased saturation for Ghibli style
            if (lightness < 128) {
                const saturation = (max - min) / (max + min);
                const newSaturation = Math.min(saturation * satIncrease, 1);
                const satRatio = newSaturation / saturation;
                
                const mid = (max + min) / 2;
                data[i] = mid + (data[i] - mid) * satRatio;
                data[i + 1] = mid + (data[i + 1] - mid) * satRatio;
                data[i + 2] = mid + (data[i + 2] - mid) * satRatio;
            } else {
                const saturation = (max - min) / (510 - max - min);
                const newSaturation = Math.min(saturation * satIncrease, 1);
                const satRatio = newSaturation / saturation;
                
                const mid = (max + min) / 2;
                data[i] = mid + (data[i] - mid) * satRatio;
                data[i + 1] = mid + (data[i + 1] - mid) * satRatio;
                data[i + 2] = mid + (data[i + 2] - mid) * satRatio;
            }
        }
    }
    
    // Put the processed image data back
    tempCtx.putImageData(imageData, 0, 0);
    
    // Apply bilateral filtering for smooth areas while preserving edges (Ghibli style)
    applyBilateralFilter(tempCtx, width, height);
    
    // Add artistic edge detection for cartoon outlines
    applyArtisticEdges(tempCtx, width, height);
    
    // Add subtle texture for a more artistic look
    applyTextureOverlay(tempCtx, width, height);
    
    // Draw the final result back to the original canvas
    ctx.drawImage(tempCanvas, 0, 0);
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

// Export functions for use in main.js
window.cartoonEffectModule = {
    initCartoonEffect,
    applyCartoonEffect,
    isCartoonEffectActive
}; 