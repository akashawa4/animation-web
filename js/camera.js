// Camera handling and snapshot functionality
let videoStream = null;
let isProcessing = false;

// Initialize webcam with comprehensive error handling
// Update the initCamera function to include the new adjustments
async function initCamera() {
    const video = document.getElementById('webcam');
    const outputCanvas = document.getElementById('outputCanvas');
    const statusElement = document.createElement('div');
    statusElement.id = 'cameraStatus';
    statusElement.style.position = 'absolute';
    statusElement.style.bottom = '10px';
    statusElement.style.left = '10px';
    statusElement.style.color = 'white';
    statusElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    statusElement.style.padding = '5px';
    statusElement.style.borderRadius = '3px';
    statusElement.style.fontSize = '12px';
    statusElement.style.zIndex = '100';
    
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer && !document.getElementById('cameraStatus')) {
        videoContainer.appendChild(statusElement);
    }
    
    if (!video) {
        console.error('Video element not found');
        updateStatus('Error: Video element not found');
        return false;
    }
    
    // Clear any existing streams
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    // Create processing canvas if it doesn't exist
    let processingCanvas = document.getElementById('processingCanvas');
    if (!processingCanvas) {
        processingCanvas = document.createElement('canvas');
        processingCanvas.id = 'processingCanvas';
        processingCanvas.style.display = 'none';
        document.body.appendChild(processingCanvas);
    }
    
    try {
        updateStatus('Requesting camera access...');
        
        // Get list of available video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Use the first camera by default
        let selectedDeviceId = '';
        
        // Check if we have a saved preference
        const savedDeviceId = localStorage.getItem('preferredCameraId');
        if (savedDeviceId && videoDevices.some(device => device.deviceId === savedDeviceId)) {
            selectedDeviceId = savedDeviceId;
        } else if (videoDevices.length > 0) {
            selectedDeviceId = videoDevices[0].deviceId;
        }
        
        // Set up constraints with the selected device
        const constraints = {
            video: selectedDeviceId 
                ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        };
        
        // Get video stream
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set video source
        video.srcObject = videoStream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    console.log(`Initial video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                    
                    // Set canvas dimensions to match video
                    if (outputCanvas) {
                        outputCanvas.width = video.videoWidth;
                        outputCanvas.height = video.videoHeight;
                        
                        // Update container aspect ratio
                        const aspectRatio = video.videoWidth / video.videoHeight;
                        console.log(`Initial aspect ratio: ${aspectRatio}`);
                        
                        const videoContainer = document.querySelector('.video-container');
                        if (videoContainer) {
                            videoContainer.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;
                            console.log(`Initial container padding-bottom: ${(1 / aspectRatio) * 100}%`);
                        }
                        
                        // Initial branding overlay adjustment
                        adjustBrandingOverlay(video.videoWidth, video.videoHeight);
                    }
                    resolve();
                }).catch(error => {
                    console.error('Error playing video:', error);
                    resolve();
                });
            };
        });
        
        // Set canvas dimensions to match video
        if (outputCanvas) {
            outputCanvas.width = video.videoWidth;
            outputCanvas.height = video.videoHeight;
            
            // Start rendering video to canvas
            ensureVideoRendering();
        }
        
        // Add webcam selector after successful initialization
        await addWebcamSelector();
        
        // Set up watermark toggle
        setupWatermarkToggle();
        
        updateStatus('Camera initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing camera:', error);
        updateStatus(`Error initializing camera: ${error.message}`);
        showCameraErrorMessage(error);
        return false;
    }
}

// Update status message
function updateStatus(message) {
    console.log('Camera status:', message);
    const statusElement = document.getElementById('cameraStatus');
    if (statusElement) {
        statusElement.textContent = message;
        
        // Auto-hide status after 5 seconds unless it's an error message
        if (!message.toLowerCase().includes('error')) {
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.textContent = '';
                }
            }, 5000);
        }
    }
}

// Show detailed camera error message
function showCameraErrorMessage(error) {
    const errorContainer = document.createElement('div');
    errorContainer.id = 'cameraErrorContainer';
    errorContainer.style.position = 'absolute';
    errorContainer.style.top = '50%';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translate(-50%, -50%)';
    errorContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    errorContainer.style.color = 'white';
    errorContainer.style.padding = '20px';
    errorContainer.style.borderRadius = '10px';
    errorContainer.style.zIndex = '1000';
    errorContainer.style.maxWidth = '80%';
    errorContainer.style.textAlign = 'center';
    
    // Remove existing error container if present
    const existingContainer = document.getElementById('cameraErrorContainer');
    if (existingContainer) {
        existingContainer.parentNode.removeChild(existingContainer);
    }
    
    let message = 'Error accessing camera. ';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message += 'Please allow camera access in your browser settings.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message += 'No camera found. Please connect a webcam and try again.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        message += 'Camera is already in use by another application. Please close other applications using the camera.';
    } else if (error.name === 'AbortError') {
        message += 'Camera initialization was aborted. Please try again.';
    } else if (error.name === 'SecurityError') {
        message += 'Camera access was blocked due to security restrictions. Please use HTTPS or localhost.';
    } else if (error.name === 'NotSupportedError') {
        message += 'Your browser does not support camera access. Please try a different browser like Chrome or Firefox.';
    } else {
        message += 'Please make sure you have a webcam connected and have granted permission to use it.';
    }
    
    errorContainer.textContent = message;
    
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.appendChild(errorContainer);
        
        // Add a retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.style.marginTop = '15px';
        retryButton.style.padding = '8px 16px';
        retryButton.style.backgroundColor = '#f97316';
        retryButton.style.border = 'none';
        retryButton.style.borderRadius = '4px';
        retryButton.style.cursor = 'pointer';
        retryButton.onclick = () => {
            errorContainer.parentNode.removeChild(errorContainer);
            initCamera();
        };
        
        errorContainer.appendChild(document.createElement('br'));
        errorContainer.appendChild(retryButton);
    }
}

// Capture snapshot with improved error handling
// Update the capture function to process with AnimeGAN if needed
// Update the captureSnapshot function to properly handle anime effect

async function captureSnapshot() {
    console.log('Capturing snapshot...');
    
    const video = document.getElementById('webcam');
    const outputCanvas = document.getElementById('outputCanvas');
    
    if (!video || !outputCanvas) {
        console.error('Video element or output canvas not found', {
            video: !!video,
            outputCanvas: !!outputCanvas
        });
        return;
    }
    
    try {
        // Create a flash effect
        createFlashEffect();
        
        // Play shutter sound
        playShutterSound();
        
        // Get the canvas with current effects applied
        const imageDataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
        
        // Process with AnimeGAN if that effect is selected
        let finalImageUrl = imageDataUrl;
        
        console.log("Current effect:", window.currentEffect);
        
        if (window.currentEffect === 'anime') {
            console.log("Applying anime effect...");
            
            // Show loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.id = 'processingMessage';
            loadingMessage.textContent = 'Processing with AnimeGAN...';
            loadingMessage.style.position = 'fixed';
            loadingMessage.style.top = '50%';
            loadingMessage.style.left = '50%';
            loadingMessage.style.transform = 'translate(-50%, -50%)';
            loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            loadingMessage.style.color = 'white';
            loadingMessage.style.padding = '20px';
            loadingMessage.style.borderRadius = '10px';
            loadingMessage.style.zIndex = '1000';
            document.body.appendChild(loadingMessage);
            
            try {
                if (window.animeGanModule && typeof window.animeGanModule.applyAnimeEffect === 'function') {
                    finalImageUrl = await window.animeGanModule.applyAnimeEffect(imageDataUrl);
                    console.log("Anime effect applied successfully");
                } else {
                    console.error('AnimeGAN module not available or method not found');
                    alert('AnimeGAN effect is not available. Using original image instead.');
                }
            } catch (error) {
                console.error('Error processing with AnimeGAN:', error);
                alert('Error applying anime effect. Using original image instead.');
            } finally {
                // Remove loading message
                if (document.body.contains(loadingMessage)) {
                    document.body.removeChild(loadingMessage);
                }
            }
        }
        
        // Add watermark if enabled
        if (isWatermarkEnabled) {
            finalImageUrl = await addWatermark(finalImageUrl);
        }
        
        // Display the captured image
        displayCapturedImage(finalImageUrl);
        
        // Add download button
        addDownloadButton();
        
        // Setup social sharing
        setupSocialSharing(finalImageUrl);
        
    } catch (error) {
        console.error('Error capturing snapshot:', error);
        updateStatus('Error capturing image: ' + error.message);
    }
}

// Clean up camera resources
function cleanupCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// Add watermark to the image
function addWatermark(ctx, width, height) {
    // Get branding information from the branding overlay
    const brandingOverlay = document.querySelector('.branding-overlay');
    let eventName = "INVENTO 2K25";
    let collegeName = "DR. D.Y. PATIL PRATISHTHAN'S COLLEGE OF ENGINEERING";
    let tagline = "Innovate • Create • Inspire";
    
    // Try to get text from the DOM if available
    if (brandingOverlay) {
        const eventNameEl = brandingOverlay.querySelector('.event-name');
        const collegeNameEl = brandingOverlay.querySelector('.college-name');
        const taglineEl = brandingOverlay.querySelector('.event-tagline');
        
        if (eventNameEl) eventName = eventNameEl.textContent;
        if (collegeNameEl) collegeName = collegeNameEl.textContent;
        if (taglineEl) tagline = taglineEl.textContent;
    }
    
    // Set watermark styles
    ctx.save();
    
    // Semi-transparent background for watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, height - 80, width, 80);
    
    // Event name (large)
    ctx.font = 'bold 24px Poppins, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(eventName, width / 2, height - 50);
    
    // College name (medium)
    ctx.font = '14px Poppins, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(collegeName, width / 2, height - 30);
    
    // Tagline (small)
    ctx.font = 'italic 12px Poppins, Arial, sans-serif';
    ctx.fillStyle = 'rgba(249, 115, 22, 0.9)'; // Orange color
    ctx.fillText(tagline, width / 2, height - 10);
    
    // Add logos if available
    try {
        const collegeLogoImg = document.querySelector('.college-logo img');
        const eventLogoImg = document.querySelector('.event-logo img');
        
        if (collegeLogoImg && collegeLogoImg.complete) {
            // Draw college logo in bottom left
            const logoSize = 40;
            ctx.globalAlpha = 0.8;
            ctx.drawImage(collegeLogoImg, 10, height - logoSize - 10, logoSize, logoSize);
        }
        
        if (eventLogoImg && eventLogoImg.complete) {
            // Draw event logo in bottom right
            const logoSize = 40;
            ctx.globalAlpha = 0.8;
            ctx.drawImage(eventLogoImg, width - logoSize - 10, height - logoSize - 10, logoSize, logoSize);
        }
    } catch (e) {
        console.warn('Could not add logos to watermark:', e);
    }
    
    ctx.restore();
}

// Add this function to ensure the video is properly rendered to the canvas
function ensureVideoRendering() {
    const video = document.getElementById('webcam');
    const outputCanvas = document.getElementById('outputCanvas');
    
    if (!video || !outputCanvas) return;
    
    const ctx = outputCanvas.getContext('2d');
    
    // Make sure canvas dimensions match video
    if (video.videoWidth && video.videoHeight) {
        if (outputCanvas.width !== video.videoWidth || outputCanvas.height !== video.videoHeight) {
            console.log(`Updating canvas dimensions to match video: ${video.videoWidth}x${video.videoHeight}`);
            outputCanvas.width = video.videoWidth;
            outputCanvas.height = video.videoHeight;
            
            // Update container aspect ratio
            const aspectRatio = video.videoWidth / video.videoHeight;
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;
                console.log(`Updated container padding-bottom to: ${(1 / aspectRatio) * 100}%`);
            }
            
            // Adjust branding overlay
            adjustBrandingOverlay(video.videoWidth, video.videoHeight);
        }
    }
    
    // Draw video to canvas if video is playing
    if (video.readyState === 4 && !isProcessing) {
        ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
        
        // Add live watermark preview to the canvas if enabled
        const previewWatermark = document.getElementById('previewWatermark');
        if (previewWatermark && previewWatermark.checked) {
            addWatermark(ctx, outputCanvas.width, outputCanvas.height);
        }
    }
    
    // Continue rendering
    requestAnimationFrame(ensureVideoRendering);
}

// Setup watermark toggle
function setupWatermarkToggle() {
    const controls = document.querySelector('.controls');
    if (!controls) return;
    
    // Check if toggle already exists
    if (document.querySelector('.watermark-toggle')) return;
    
    // Create watermark toggle container
    const watermarkToggle = document.createElement('div');
    watermarkToggle.className = 'watermark-toggle';
    watermarkToggle.style.marginTop = '15px';
    watermarkToggle.style.display = 'flex';
    watermarkToggle.style.alignItems = 'center';
    watermarkToggle.style.justifyContent = 'center';
    
    // Create checkbox and label
    watermarkToggle.innerHTML = `
        <label for="previewWatermark" style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="previewWatermark" checked>
            <span style="margin-left: 8px; color: white;">Preview Watermark</span>
        </label>
    `;
    
    // Add to controls
    controls.appendChild(watermarkToggle);
    
    // Add event listener for checkbox
    const checkbox = document.getElementById('previewWatermark');
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            // Store the preference
            localStorage.setItem('previewWatermark', checkbox.checked);
            console.log('Watermark preview toggled:', checkbox.checked);
        });
        
        // Load saved preference
        const savedPreference = localStorage.getItem('previewWatermark');
        if (savedPreference !== null) {
            checkbox.checked = savedPreference === 'true';
        }
    }
}

// Setup capture button
function setupCaptureButton() {
    const captureBtn = document.getElementById('captureBtn');
    if (!captureBtn) {
        console.error('Capture button not found');
        return;
    }
    
    // Remove any existing event listeners to prevent duplicates
    const newCaptureBtn = captureBtn.cloneNode(true);
    captureBtn.parentNode.replaceChild(newCaptureBtn, captureBtn);
    
    // Add click event listener
    newCaptureBtn.addEventListener('click', () => {
        console.log('Capture button clicked');
        captureSnapshot();
    });
    
    console.log('Capture button setup complete');
}

// Setup close button for result container
function setupCloseButton() {
    const closeBtn = document.getElementById('closeResultBtn');
    const resultContainer = document.getElementById('resultContainer');
    
    if (!closeBtn || !resultContainer) {
        console.error('Close button or result container not found');
        return;
    }
    
    // Remove any existing event listeners to prevent duplicates
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    // Add click event listener to hide the result container
    newCloseBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        resultContainer.style.display = 'none';
    });
    
    console.log('Close button setup complete');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Call this function after a short delay to ensure all elements are loaded
    setTimeout(async () => {
        console.log('Initializing camera...');
        await initCamera();
        setupCaptureButton();
        setupCloseButton();
        setupWatermarkToggle();
    }, 1000);
});

// Export functions to global scope
window.initCamera = initCamera;
window.captureSnapshot = captureSnapshot;
window.cleanupCamera = cleanupCamera;
window.addWatermark = addWatermark;

// Add webcam selector function
async function addWebcamSelector() {
    try {
        // Get list of available video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length <= 1) {
            console.log('Only one camera detected, not adding selector');
            return;
        }
        
        console.log(`Found ${videoDevices.length} cameras`);
        
        // Create webcam selector container
        const controlsSection = document.querySelector('.controls');
        if (!controlsSection) return;
        
        // Check if selector already exists
        if (document.getElementById('webcamSelector')) return;
        
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'webcam-selector-container';
        selectorContainer.style.marginTop = '15px';
        selectorContainer.style.marginBottom = '15px';
        selectorContainer.style.textAlign = 'center';
        
        // Create select element
        const select = document.createElement('select');
        select.id = 'webcamSelector';
        select.style.padding = '8px 12px';
        select.style.borderRadius = '5px';
        select.style.backgroundColor = '#333';
        select.style.color = 'white';
        select.style.border = '1px solid #555';
        select.style.cursor = 'pointer';
        
        // Add options for each device
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            select.appendChild(option);
        });
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = 'webcamSelector';
        label.textContent = 'Select Camera: ';
        label.style.color = 'white';
        label.style.marginRight = '10px';
        
        // Add elements to container
        selectorContainer.appendChild(label);
        selectorContainer.appendChild(select);
        
        // Insert at the top of controls
        controlsSection.insertBefore(selectorContainer, controlsSection.firstChild);
        
        // Add change event listener
        select.addEventListener('change', async () => {
            const selectedDeviceId = select.value;
            await switchCamera(selectedDeviceId);
        });
        
        console.log('Webcam selector added successfully');
    } catch (error) {
        console.error('Error creating webcam selector:', error);
    }
}

// Function to switch between cameras
async function switchCamera(deviceId) {
    try {
        console.log(`Switching to camera with ID: ${deviceId}`);
        updateStatus('Switching camera...');
        
        // Stop current stream
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        
        // Get video element
        const video = document.getElementById('webcam');
        if (!video) {
            console.error('Video element not found');
            return false;
        }
        
        // Set up constraints with the selected device
        const constraints = {
            video: {
                deviceId: { exact: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        // Get new stream
        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Update video source
        video.srcObject = videoStream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
                    resolve();
                }).catch(error => {
                    console.error('Error playing video:', error);
                    resolve();
                });
            };
        });
        
        // Update canvas dimensions
        const outputCanvas = document.getElementById('outputCanvas');
        if (outputCanvas) {
            // Store the original aspect ratio
            const aspectRatio = video.videoWidth / video.videoHeight;
            console.log(`Video aspect ratio: ${aspectRatio}`);
            
            // Set canvas dimensions to match video
            outputCanvas.width = video.videoWidth;
            outputCanvas.height = video.videoHeight;
            
            // Update video container padding to maintain aspect ratio
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.style.paddingBottom = `${(1 / aspectRatio) * 100}%`;
                console.log(`Setting container padding-bottom to: ${(1 / aspectRatio) * 100}%`);
            }
            
            // Adjust branding overlay based on resolution
            adjustBrandingOverlay(video.videoWidth, video.videoHeight);
        }
        
        // Save selected device ID to localStorage
        localStorage.setItem('preferredCameraId', deviceId);
        
        updateStatus('Camera switched successfully');
        console.log('Camera switched successfully');
        return true;
    } catch (error) {
        console.error('Error switching camera:', error);
        updateStatus(`Error switching camera: ${error.message}`);
        showCameraErrorMessage(error);
        return false;
    }
}

// Add this function to your camera.js file
function handleWindowResize() {
    const video = document.getElementById('webcam');
    if (video && video.videoWidth && video.videoHeight) {
        adjustBrandingOverlay(video.videoWidth, video.videoHeight);
    }
}

// Add this to your initialization code (e.g., at the end of initCamera)
window.addEventListener('resize', handleWindowResize);

// Add this new function to adjust branding overlay based on video dimensions
function adjustBrandingOverlay(width, height) {
    const brandingOverlay = document.querySelector('.branding-overlay');
    if (!brandingOverlay) return;
    
    console.log(`Adjusting branding overlay for dimensions: ${width}x${height}`);
    
    // Calculate scale factor based on reference resolution (1280x720)
    const referenceWidth = 1280;
    const referenceHeight = 720;
    
    // Use the smaller scaling factor to ensure text fits
    const widthScale = width / referenceWidth;
    const heightScale = height / referenceHeight;
    const scaleFactor = Math.min(widthScale, heightScale);
    
    console.log(`Scale factor: ${scaleFactor} (width: ${widthScale}, height: ${heightScale})`);
    
    // Adjust padding based on scale factor
    const basePadding = 15;
    const scaledPadding = Math.max(basePadding * scaleFactor, 8); // Minimum padding of 8px
    brandingOverlay.style.padding = `${scaledPadding}px`;
    
    // Adjust logo sizes
    const logoImages = brandingOverlay.querySelectorAll('.college-logo img, .event-logo img');
    const baseLogoHeight = 60;
    const scaledLogoHeight = Math.max(baseLogoHeight * scaleFactor, 30); // Minimum height of 30px
    
    logoImages.forEach(img => {
        img.style.height = `${scaledLogoHeight}px`;
    });
    
    // Adjust text sizes
    const eventName = brandingOverlay.querySelector('.event-name');
    const collegeName = brandingOverlay.querySelector('.college-name');
    const eventTagline = brandingOverlay.querySelector('.event-tagline');
    
    if (eventName && collegeName && eventTagline) {
        // Base font sizes
        const baseEventNameSize = 24;
        const baseCollegeNameSize = 16;
        const baseTaglineSize = 14;
        
        // Apply scaled font sizes with minimums
        eventName.style.fontSize = `${Math.max(baseEventNameSize * scaleFactor, 16)}px`;
        collegeName.style.fontSize = `${Math.max(baseCollegeNameSize * scaleFactor, 12)}px`;
        eventTagline.style.fontSize = `${Math.max(baseTaglineSize * scaleFactor, 10)}px`;
        
        console.log(`Applied font sizes - Event: ${eventName.style.fontSize}, College: ${collegeName.style.fontSize}, Tagline: ${eventTagline.style.fontSize}`);
    }
}