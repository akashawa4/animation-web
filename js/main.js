// Main application logic

// Update welcome message with user name
function updateWelcomeMessage(name) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const funMessage = document.getElementById('funMessage');
    
    if (name && name.trim() !== '') {
        welcomeMessage.textContent = `Welcome to INVENTO 2K25, ${name}!`;
    } else {
        welcomeMessage.textContent = 'Welcome to INVENTO 2K25!';
    }
    
    // Display a random fun message
    funMessage.textContent = getRandomFunMessage();
}

// Initialize the application
async function initApp() {
    // Update countdown timer
    updateCountdown();
    
    // Load AI models
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
        console.error('Failed to load AI models');
        alert('Some features may not work properly. Please refresh the page and try again.');
    }
    
    // Initialize camera
    // Initialize camera with retry logic
    let cameraInitialized = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!cameraInitialized && retryCount < maxRetries) {
        console.log(`Attempting to initialize camera (attempt ${retryCount + 1}/${maxRetries})...`);
        cameraInitialized = await initCamera();
        
        if (!cameraInitialized) {
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`Camera initialization failed. Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    if (!cameraInitialized) {
        console.error('Failed to initialize camera after multiple attempts');
        document.getElementById('loadingMessage').textContent = 
            'Camera access failed. Please check your camera permissions and refresh the page.';
        return;
    }
    
    // Initialize cartoon effect
    if (window.cartoonEffectModule) {
        window.cartoonEffectModule.initCartoonEffect();
    } else {
        console.error('Cartoon effect module not loaded');
    }
     // Make sure animeGanModule is available globally
     if (!window.animeGanModule) {
        console.warn('AnimeGAN module not found, creating empty module');
        window.animeGanModule = {
            applyAnimeEffect: async function(imageDataUrl) {
                console.log('AnimeGAN effect requested but module not properly loaded');
                return imageDataUrl; // Return original image if module not available
            }
        };
    }
    
    // Initialize global currentEffect variable
    window.currentEffect = 'normal';
    console.log('Initial effect set to:', window.currentEffect);
    
    // Set up event listeners
    setupEffectButtons();
    setupCaptureButton();
    setupQRScanner();
    
    // Set up name submission
    const submitNameBtn = document.getElementById('submitName');
    const userNameInput = document.getElementById('userName');
    
    submitNameBtn.addEventListener('click', () => {
        const name = userNameInput.value;
        updateWelcomeMessage(name);
    });
    
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const name = userNameInput.value;
            updateWelcomeMessage(name);
        }
    });
    
    // Display initial welcome message and fun message
    updateWelcomeMessage('');
    
    // Clean up resources when page is unloaded
    window.addEventListener('beforeunload', () => {
        cleanupCamera();
    });
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add social media sharing functionality
function setupSocialSharing(imageUrl) {
    // Create sharing URLs for different platforms
    const shareText = encodeURIComponent('Check out my photo from INVENTO 2K25 at DYPSN College!');
    const shareUrl = encodeURIComponent(imageUrl);
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
    
    return {
        facebook: facebookUrl,
        twitter: twitterUrl,
        whatsapp: whatsappUrl
    };
}

// Add confetti effect when capturing image
function playConfettiEffect() {
    // Simple confetti effect using canvas
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const confettiCount = 200;
    const confetti = [];
    
    // Create confetti particles
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -20,
            size: Math.random() * 10 + 5,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 6.28
        });
    }
    
    // Animate confetti
    let animationFrame;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let finished = true;
        confetti.forEach(particle => {
            particle.y += particle.speed;
            particle.x += Math.sin(particle.angle) * 2;
            
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            
            if (particle.y < canvas.height) {
                finished = false;
            }
        });
        
        if (finished) {
            cancelAnimationFrame(animationFrame);
            document.body.removeChild(canvas);
        } else {
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Update capture button to include confetti effect
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        const originalClickHandler = captureBtn.onclick;
        captureBtn.onclick = function(e) {
            playConfettiEffect();
            if (originalClickHandler) {
                originalClickHandler.call(this, e);
            }
        };
    }
});

// Add social media sharing buttons to the result container
function addSocialSharingButtons() {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) return;
    
    // Create social sharing container if it doesn't exist
    let socialContainer = document.querySelector('.social-sharing-container');
    if (!socialContainer) {
        socialContainer = document.createElement('div');
        socialContainer.className = 'social-sharing-container';
        socialContainer.style.display = 'flex';
        socialContainer.style.justifyContent = 'center';
        socialContainer.style.gap = '15px';
        socialContainer.style.marginTop = '15px';
        
        // Insert before the close button
        const closeBtn = document.getElementById('closeResultBtn');
        if (closeBtn) {
            resultContainer.insertBefore(socialContainer, closeBtn);
        } else {
            resultContainer.appendChild(socialContainer);
        }
    }
}

// Add event-themed stickers functionality
function setupStickerFeature() {
    // Create sticker container
    const stickerContainer = document.createElement('div');
    stickerContainer.className = 'sticker-container';
    stickerContainer.innerHTML = `
        <h3>Add Stickers</h3>
        <div class="sticker-options">
            <img src="assets/stickers/invento-logo-sticker.png" class="sticker" data-sticker="logo">
            <img src="assets/stickers/dypsn-sticker.png" class="sticker" data-sticker="dypsn">
            <img src="assets/stickers/tech-sticker.png" class="sticker" data-sticker="tech">
            <img src="assets/stickers/2k25-sticker.png" class="sticker" data-sticker="2k25">
        </div>
    `;
    
    // Style the sticker container
    stickerContainer.style.marginTop = '20px';
    stickerContainer.style.textAlign = 'center';
    
    // Style the sticker options
    const stickerOptions = stickerContainer.querySelector('.sticker-options');
    stickerOptions.style.display = 'flex';
    stickerOptions.style.justifyContent = 'center';
    stickerOptions.style.flexWrap = 'wrap';
    stickerOptions.style.gap = '10px';
    stickerOptions.style.marginTop = '10px';
    
    // Style the stickers
    const stickers = stickerContainer.querySelectorAll('.sticker');
    stickers.forEach(sticker => {
        sticker.style.width = '50px';
        sticker.style.height = '50px';
        sticker.style.cursor = 'pointer';
        sticker.style.border = '2px solid transparent';
        sticker.style.borderRadius = '5px';
        sticker.style.transition = 'transform 0.2s, border-color 0.2s';
        
        // Add hover effect
        sticker.addEventListener('mouseover', () => {
            sticker.style.transform = 'scale(1.1)';
            sticker.style.borderColor = '#f97316';
        });
        
        sticker.addEventListener('mouseout', () => {
            sticker.style.transform = 'scale(1)';
            sticker.style.borderColor = 'transparent';
        });
        
        // Add click handler
        sticker.addEventListener('click', () => {
            applySticker(sticker.dataset.sticker);
        });
    });
    
    // Add to controls section
    const controlsSection = document.querySelector('.controls');
    if (controlsSection) {
        controlsSection.appendChild(stickerContainer);
    }
}

// Apply sticker to the canvas
function applySticker(stickerType) {
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create new image for sticker
    const sticker = new Image();
    sticker.src = `assets/stickers/${stickerType}-sticker.png`;
    
    sticker.onload = () => {
        // Calculate sticker size based on canvas size
        const stickerSize = Math.min(canvas.width, canvas.height) * 0.2;
        const x = canvas.width - stickerSize - 20;
        const y = canvas.height - stickerSize - 20;
        
        // Draw sticker
        ctx.drawImage(sticker, x, y, stickerSize, stickerSize);
    };
}

// Initialize additional features when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded');
    
    // Try to initialize camera with a slight delay to ensure DOM is fully ready
    setTimeout(async () => {
        console.log('Initializing camera...');
        const cameraInitialized = await initCamera();
        
        if (!cameraInitialized) {
            console.warn('Initial camera initialization failed, will retry once more');
            // Try one more time after a delay
            setTimeout(async () => {
                await initCamera();
            }, 2000);
        }
    }, 500);
    
    // Rest of your initialization code
    // ...
});

// Add event theme customization options
addEventThemeCustomization();

// Add event theme customization
function addEventThemeCustomization() {
    // Create theme selector in the controls section
    const controlsSection = document.querySelector('.controls');
    if (!controlsSection) return;
    
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
        <h3>Event Theme</h3>
        <div class="theme-options">
            <button class="theme-btn active" data-theme="default">Default</button>
            <button class="theme-btn" data-theme="tech">Tech</button>
            <button class="theme-btn" data-theme="futuristic">Futuristic</button>
            <button class="theme-btn" data-theme="celebration">Celebration</button>
        </div>
    `;
    
    // Style the theme selector
    themeSelector.style.marginTop = '20px';
    themeSelector.style.textAlign = 'center';
    
    // Style the theme options
    const themeOptions = themeSelector.querySelector('.theme-options');
    themeOptions.style.display = 'flex';
    themeOptions.style.justifyContent = 'center';
    themeOptions.style.flexWrap = 'wrap';
    themeOptions.style.gap = '10px';
    themeOptions.style.marginTop = '10px';
    
    // Add to controls section
    controlsSection.appendChild(themeSelector);
    
    // Add event listeners to theme buttons
    const themeButtons = themeSelector.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            themeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Apply selected theme
            applyEventTheme(button.dataset.theme);
        });
    });
}

// Apply selected event theme
function applyEventTheme(theme) {
    const videoContainer = document.querySelector('.video-container');
    const outputCanvas = document.getElementById('outputCanvas');
    const eventOverlay = document.querySelector('.event-overlay');
    
    if (!videoContainer || !outputCanvas || !eventOverlay) return;
    
    // Reset previous theme styles
    videoContainer.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5)';
    eventOverlay.style.color = '';
    
    // Apply theme-specific styles
    switch (theme) {
        case 'tech':
            // Tech theme with blue glow and circuit pattern
            videoContainer.style.boxShadow = '0 0 30px rgba(0, 153, 255, 0.7)';
            videoContainer.style.backgroundImage = 'url("assets/backgrounds/circuit-pattern.png")';
            eventOverlay.style.color = '#00c3ff';
            
            // Change background image for AI processing
            updateBackgroundImage('assets/backgrounds/tech-bg.jpg');
            break;
            
        case 'futuristic':
            // Futuristic theme with purple glow and grid pattern
            videoContainer.style.boxShadow = '0 0 30px rgba(170, 0, 255, 0.7)';
            videoContainer.style.backgroundImage = 'url("assets/backgrounds/grid-pattern.png")';
            eventOverlay.style.color = '#bb00ff';
            
            // Change background image for AI processing
            updateBackgroundImage('assets/backgrounds/futuristic-bg.jpg');
            break;
            
        case 'celebration':
            // Celebration theme with orange glow and confetti pattern
            videoContainer.style.boxShadow = '0 0 30px rgba(255, 102, 0, 0.7)';
            videoContainer.style.backgroundImage = 'url("assets/backgrounds/confetti-pattern.png")';
            eventOverlay.style.color = '#ff6600';
            
            // Change background image for AI processing
            updateBackgroundImage('assets/backgrounds/celebration-bg.jpg');
            break;
            
        case 'default':
        default:
            // Default theme with standard shadow and no pattern
            videoContainer.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.5)';
            videoContainer.style.backgroundImage = 'none';
            eventOverlay.style.color = '#ffffff';
            
            // Change background image for AI processing
            // In the initApp function, add this after loadModels()
            updateBackgroundImage('assets/backgrounds/event-bg.jpg');
            break;
    }
}

// Update background image used for AI processing
function updateBackgroundImage(imagePath) {
    if (!backgroundImage) return;
    
    backgroundImage.src = imagePath;
    backgroundImage.onload = () => {
        console.log(`Background image updated to: ${imagePath}`);
    };
}

// Create and populate social media sharing buttons
function createSocialSharingButtons(imageUrl) {
    const socialContainer = document.querySelector('.social-sharing-container');
    if (!socialContainer) return;
    
    // Clear previous buttons
    socialContainer.innerHTML = '';
    
    // Get sharing URLs
    const sharingUrls = setupSocialSharing(imageUrl);
    
    // Create Facebook button
    const facebookBtn = document.createElement('a');
    facebookBtn.href = sharingUrls.facebook;
    facebookBtn.target = '_blank';
    facebookBtn.className = 'social-btn facebook-btn';
    facebookBtn.innerHTML = '<i class="fab fa-facebook-f"></i> Share';
    facebookBtn.style.backgroundColor = '#3b5998';
    facebookBtn.style.color = 'white';
    facebookBtn.style.padding = '8px 15px';
    facebookBtn.style.borderRadius = '5px';
    facebookBtn.style.textDecoration = 'none';
    facebookBtn.style.display = 'inline-flex';
    facebookBtn.style.alignItems = 'center';
    facebookBtn.style.justifyContent = 'center';
    facebookBtn.style.fontWeight = 'bold';
    
    // Create Twitter button
    const twitterBtn = document.createElement('a');
    twitterBtn.href = sharingUrls.twitter;
    twitterBtn.target = '_blank';
    twitterBtn.className = 'social-btn twitter-btn';
    twitterBtn.innerHTML = '<i class="fab fa-twitter"></i> Tweet';
    twitterBtn.style.backgroundColor = '#1da1f2';
    twitterBtn.style.color = 'white';
    twitterBtn.style.padding = '8px 15px';
    twitterBtn.style.borderRadius = '5px';
    twitterBtn.style.textDecoration = 'none';
    twitterBtn.style.display = 'inline-flex';
    twitterBtn.style.alignItems = 'center';
    twitterBtn.style.justifyContent = 'center';
    twitterBtn.style.fontWeight = 'bold';
    
    // Create WhatsApp button
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = sharingUrls.whatsapp;
    whatsappBtn.target = '_blank';
    whatsappBtn.className = 'social-btn whatsapp-btn';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Share';
    whatsappBtn.style.backgroundColor = '#25d366';
    whatsappBtn.style.color = 'white';
    whatsappBtn.style.padding = '8px 15px';
    whatsappBtn.style.borderRadius = '5px';
    whatsappBtn.style.textDecoration = 'none';
    whatsappBtn.style.display = 'inline-flex';
    whatsappBtn.style.alignItems = 'center';
    whatsappBtn.style.justifyContent = 'center';
    whatsappBtn.style.fontWeight = 'bold';
    
    // Add buttons to container
    socialContainer.appendChild(facebookBtn);
    socialContainer.appendChild(twitterBtn);
    socialContainer.appendChild(whatsappBtn);
    
    // Add Font Awesome if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
}

// Update social sharing buttons when an image is captured
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            setTimeout(() => {
                const capturedImage = document.getElementById('capturedImage');
                if (capturedImage && capturedImage.src) {
                    // Create social sharing container if it doesn't exist
                    addSocialSharingButtons();
                    
                    // Create and populate social sharing buttons
                    createSocialSharingButtons(capturedImage.src);
                }
            }, 500);
        });
    }
});

// Add download button to result container
function addDownloadButton() {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) return;
    
    // Create download button if it doesn't exist
    let downloadBtn = document.getElementById('downloadBtn');
    if (!downloadBtn) {
        downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadBtn';
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download Image';
        downloadBtn.style.backgroundColor = '#4CAF50';
        downloadBtn.style.color = 'white';
        downloadBtn.style.padding = '10px 20px';
        downloadBtn.style.border = 'none';
        downloadBtn.style.borderRadius = '5px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.margin = '15px 0';
        downloadBtn.style.fontWeight = 'bold';
        
        // Add hover effect
        downloadBtn.addEventListener('mouseover', () => {
            downloadBtn.style.backgroundColor = '#45a049';
        });
        
        downloadBtn.addEventListener('mouseout', () => {
            downloadBtn.style.backgroundColor = '#4CAF50';
        });
        
        // Add click event to download image
        downloadBtn.addEventListener('click', () => {
            const capturedImage = document.getElementById('capturedImage');
            if (capturedImage && capturedImage.src) {
                const link = document.createElement('a');
                link.href = capturedImage.src;
                link.download = `invento2k25_${generateUniqueId()}.jpg`;
                link.click();
            }
        });
        
        // Insert before the close button
        const closeBtn = document.getElementById('closeResultBtn');
        if (closeBtn) {
            resultContainer.insertBefore(downloadBtn, closeBtn);
        } else {
            resultContainer.appendChild(downloadBtn);
        }
    }
}

// Add download button when an image is captured
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            setTimeout(() => {
                addDownloadButton();
            }, 500);
        });
    }
});

// Add branding overlay to camera container
function addBrandingOverlay() {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;

    // Create branding overlay
    const brandingOverlay = document.createElement('div');
    brandingOverlay.className = 'branding-overlay';
    brandingOverlay.innerHTML = `
        <div class="college-logo">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfqKbgBXoM49QbsjpEPfQT_7osjXNAfhxYNg&s" alt="DYPSN Logo">
        </div>
        <div class="event-branding">
            <div class="event-name">INVENTO 2K25</div>
            <div class="college-name">DR. D.Y. PATIL PRATISHTHAN'S COLLEGE OF ENGINEERING.</div>
            <div class="event-tagline">Innovate • Create • Inspire</div>
        </div>
        <div class="event-logo">
            <img src="https://developers.google.com/community/gdg/images/logo-lockup-gdg-horizontal_720.png" alt="INVENTO Logo">
        </div>
    `;

    // Add overlay to video container
    videoContainer.appendChild(brandingOverlay);
    
    // Get current video dimensions if available
    const video = document.getElementById('webcam');
    if (video && video.videoWidth && video.videoHeight) {
        // Initial adjustment based on current video dimensions
        setTimeout(() => {
            adjustBrandingOverlay(video.videoWidth, video.videoHeight);
        }, 500);
    }
}

// Initialize branding when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    addBrandingOverlay();
});

// Setup capture button functionality
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

// Capture snapshot from video feed
function captureSnapshot() {
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
        // Create a temporary canvas to capture the current frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth || 640;
        tempCanvas.height = video.videoHeight || 480;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the current frame from the video element
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Apply watermarks to the temporary canvas
        if (window.applyWatermarks) {
            window.applyWatermarks(tempCanvas);
        }
        
        // Get the image data URL
        const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
        
        // Display the captured image
        displayCapturedImage(imageDataUrl);
        
        // Play confetti effect
        playConfettiEffect();
        
        console.log('Snapshot captured successfully');
    } catch (error) {
        console.error('Error capturing snapshot:', error);
    }
}

// Make sure to call setupCaptureButton when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Call this function after a short delay to ensure all elements are loaded
    setTimeout(() => {
        setupCaptureButton();
        setupCloseButton();
    }, 1000);
});

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

// Update the displayCapturedImage function to use our new QR code generator

function displayCapturedImage(imageDataUrl) {
    // Get result container
    const resultContainer = document.getElementById('resultContainer');
    const capturedImage = document.getElementById('capturedImage');
    
    if (!resultContainer || !capturedImage) {
        console.error('Result container or captured image element not found');
        return;
    }
    
    // Update the image source
    capturedImage.src = imageDataUrl;
    
    // Show the result container
    resultContainer.style.display = 'flex';
    
    // Make sure QR container exists
    ensureQRContainerExists();
    
    // Generate QR code with download link
    if (window.qrcodeModule && window.qrcodeModule.generateQRCode) {
        console.log('Using QR code module to generate QR code');
        window.qrcodeModule.generateQRCode(imageDataUrl)
            .then(downloadUrl => {
                console.log('QR code generated with download URL:', downloadUrl);
                
                // Add social sharing buttons
                addSocialSharingButtons();
                createSocialSharingButtons(imageDataUrl);
                
                // Add download button
                addDownloadButton();
                
                // Add stickers
                setupStickerFeature();
            })
            .catch(error => {
                console.error('Error generating QR code with module:', error);
                
                // Try fallback method
                console.log('Trying fallback QR code generation');
                if (typeof generateQRCode === 'function') {
                    generateQRCode(imageDataUrl);
                }
                
                // Continue with other features even if QR fails
                addSocialSharingButtons();
                createSocialSharingButtons(imageDataUrl);
                addDownloadButton();
                setupStickerFeature();
            });
    } else {
        console.log('QR code module not found, using direct function');
        
        // Try the direct function if it exists
        if (typeof generateQRCode === 'function') {
            generateQRCode(imageDataUrl);
        } else {
            console.error('No QR code generation function available');
        }
        
        // Continue with other features
        uploadImageToFirebase(imageDataUrl);
        addSocialSharingButtons();
        createSocialSharingButtons(imageDataUrl);
        addDownloadButton();
        setupStickerFeature();
    }
}

// Helper function to ensure QR container exists
function ensureQRContainerExists() {
    let qrContainer = document.querySelector('.qr-container');
    
    if (!qrContainer) {
        const resultContainer = document.getElementById('resultContainer');
        
        if (!resultContainer) return;
        
        // Create QR container
        qrContainer = document.createElement('div');
        qrContainer.className = 'qr-container';
        qrContainer.innerHTML = `
            <h3>Scan to Download</h3>
            <div id="qrcode"></div>
        `;
        
        // Insert after captured image
        const capturedImage = document.getElementById('capturedImage');
        if (capturedImage && capturedImage.parentNode) {
            capturedImage.parentNode.insertBefore(qrContainer, capturedImage.nextSibling);
        } else {
            resultContainer.appendChild(qrContainer);
        }
    }
}

// Upload image to Firebase
async function uploadImageToFirebase(imageDataUrl) {
    try {
        // Get user name if available
        const userName = document.getElementById('userName')?.value || 'Guest';
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'uploadIndicator';
        loadingIndicator.textContent = 'Uploading image...';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.marginTop = '10px';
        
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.appendChild(loadingIndicator);
        }
        
        // Use the Firebase storage
        const storage = window.firebaseStorage;
        const db = window.firebaseDB;
        
        if (!storage || !db) {
            console.error('Firebase services not available');
            return;
        }
        
        // Create a unique filename
        const timestamp = new Date().getTime();
        const fileName = `invento2k25_${timestamp}.jpg`;
        
        // Create a reference to the file location
        const storageRef = storage.ref(`images/${fileName}`);
        
        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        // Upload the image
        const uploadTask = storageRef.put(blob);
        
        // Listen for upload completion
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Progress indicator
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                loadingIndicator.textContent = `Uploading: ${Math.round(progress)}%`;
            },
            (error) => {
                // Handle errors
                console.error('Upload failed:', error);
                loadingIndicator.textContent = 'Upload failed. Using local image instead.';
                setTimeout(() => {
                    if (loadingIndicator.parentNode) {
                        loadingIndicator.parentNode.removeChild(loadingIndicator);
                    }
                }, 3000);
            },
            async () => {
                // Upload completed successfully
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                
                // Store metadata in Firestore
                await db.collection('photos').add({
                    fileName: fileName,
                    userName: userName,
                    downloadURL: downloadURL,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    event: 'INVENTO 2K25'
                });
                
                // Update QR code with the Firebase URL
                generateQRCode(downloadURL);
                
                // Update social sharing buttons
                createSocialSharingButtons(downloadURL);
                
                // Remove loading indicator
                if (loadingIndicator.parentNode) {
                    loadingIndicator.textContent = 'Upload complete!';
                    setTimeout(() => {
                        if (loadingIndicator.parentNode) {
                            loadingIndicator.parentNode.removeChild(loadingIndicator);
                        }
                    }, 2000);
                }
            }
        );
    } catch (error) {
        console.error('Error in Firebase upload:', error);
        // Continue with local image if Firebase upload fails
    }
}

// Create a shareable link (simplified for demo)
function createShareableLink(imageDataUrl) {
    // In a real app, you would upload the image to a server and return a URL
    // For demo purposes, we'll just use a dummy URL with a unique ID
    return `https://invento2k25.dypsn.edu/share/${generateUniqueId()}`;
}

// Generate a unique ID for sharing
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Generate QR code for the captured image
function generateQRCode(imageDataUrl) {
    const qrContainer = document.querySelector('.qr-container');
    const qrCodeElement = document.getElementById('qrcode');
    
    if (!qrContainer || !qrCodeElement) {
        console.error('QR container or QR code element not found');
        return;
    }
    
    // Clear previous QR code
    qrCodeElement.innerHTML = '';
    
    // Generate QR code with proper options
    QRCode.toCanvas(qrCodeElement, imageDataUrl, {
        width: 200,
        height: 200,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, function(error) {
        if (error) {
            console.error('Error generating QR code:', error);
        } else {
            console.log('QR code generated successfully');
        }
    });
}

// Update the applyEffect function to use the cartoon effect module
function applyEffect(ctx, width, height) {
    // Apply cartoon effect if active
    if (window.cartoonEffectModule && window.cartoonEffectModule.isCartoonEffectActive) {
        window.cartoonEffectModule.applyCartoonEffect(ctx, width, height);
        return; // Exit early to avoid applying other effects
    }
    
    // Apply other effects as needed
    // ... existing code ...
}
