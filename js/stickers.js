// Sticker functionality for INVENTO 2K25 Photo Booth

// Initialize sticker variables
let activeSticker = null;
let stickerCanvas = null;
let stickerContext = null;
let stickerImage = null;
let stickerX = 0;
let stickerY = 0;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let stickerScale = 1.0;
let stickerRotation = 0;

// Set up sticker feature
function setupStickerFeature() {
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContainer) return;
    
    // Create sticker container if it doesn't exist
    let stickerContainer = document.querySelector('.sticker-container');
    if (!stickerContainer) {
        stickerContainer = document.createElement('div');
        stickerContainer.className = 'sticker-container';
        stickerContainer.innerHTML = `
            <h3>Add Stickers</h3>
            <div class="sticker-options">
                <img src="assets/stickers/invento-logo-sticker.png" class="sticker" data-sticker="logo" alt="INVENTO Logo">
                <img src="assets/stickers/dypsn-sticker.png" class="sticker" data-sticker="dypsn" alt="DYPSN Logo">
                <img src="assets/stickers/tech-sticker.png" class="sticker" data-sticker="tech" alt="Tech Sticker">
                <img src="assets/stickers/2k25-sticker.png" class="sticker" data-sticker="2k25" alt="2K25 Sticker">
            </div>
        `;
        
        // Style the sticker container
        stickerContainer.style.marginTop = '20px';
        stickerContainer.style.textAlign = 'center';
        
        // Style the heading
        const heading = stickerContainer.querySelector('h3');
        heading.style.fontSize = '1.1rem';
        heading.style.marginBottom = '10px';
        heading.style.color = 'var(--text-color)';
        
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
                sticker.style.borderColor = 'var(--secondary-color)';
            });
            
            sticker.addEventListener('mouseout', () => {
                sticker.style.transform = 'scale(1)';
                sticker.style.borderColor = 'transparent';
            });
            
            // Add click event to apply sticker
            sticker.addEventListener('click', () => {
                applySticker(sticker.dataset.sticker);
            });
        });
        
        // Insert before the QR container
        const qrContainer = document.querySelector('.qr-container');
        if (qrContainer) {
            resultContainer.insertBefore(stickerContainer, qrContainer);
        } else {
            resultContainer.appendChild(stickerContainer);
        }
    }
    
    // Create sticker canvas if it doesn't exist
    if (!stickerCanvas) {
        // Create a canvas overlay for the sticker
        stickerCanvas = document.createElement('canvas');
        stickerCanvas.className = 'sticker-canvas';
        stickerCanvas.style.position = 'absolute';
        stickerCanvas.style.top = '0';
        stickerCanvas.style.left = '0';
        stickerCanvas.style.width = '100%';
        stickerCanvas.style.height = '100%';
        stickerCanvas.style.pointerEvents = 'none';
        
        // Add the canvas to the captured image container
        const capturedImageContainer = document.querySelector('.captured-image-container');
        if (capturedImageContainer) {
            capturedImageContainer.style.position = 'relative';
            capturedImageContainer.appendChild(stickerCanvas);
            
            // Set canvas dimensions to match the image
            const capturedImage = document.getElementById('capturedImage');
            if (capturedImage) {
                capturedImage.onload = () => {
                    stickerCanvas.width = capturedImage.clientWidth;
                    stickerCanvas.height = capturedImage.clientHeight;
                    stickerContext = stickerCanvas.getContext('2d');
                };
            }
        }
    }
    
    // Add sticker controls if they don't exist
    addStickerControls();
}

// Add sticker control buttons (rotate, resize)
function addStickerControls() {
    const stickerContainer = document.querySelector('.sticker-container');
    if (!stickerContainer) return;
    
    // Check if controls already exist
    let controlsContainer = stickerContainer.querySelector('.sticker-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'sticker-controls';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'center';
        controlsContainer.style.gap = '10px';
        controlsContainer.style.marginTop = '15px';
        
        // Rotate left button
        const rotateLeftBtn = document.createElement('button');
        rotateLeftBtn.className = 'sticker-control-btn';
        rotateLeftBtn.innerHTML = '↺';
        rotateLeftBtn.title = 'Rotate Left';
        rotateLeftBtn.style.width = '40px';
        rotateLeftBtn.style.height = '40px';
        rotateLeftBtn.style.borderRadius = '50%';
        rotateLeftBtn.style.backgroundColor = 'var(--primary-color)';
        rotateLeftBtn.style.color = 'white';
        rotateLeftBtn.style.border = 'none';
        rotateLeftBtn.style.fontSize = '18px';
        rotateLeftBtn.style.cursor = 'pointer';
        
        // Rotate right button
        const rotateRightBtn = document.createElement('button');
        rotateRightBtn.className = 'sticker-control-btn';
        rotateRightBtn.innerHTML = '↻';
        rotateRightBtn.title = 'Rotate Right';
        rotateRightBtn.style.width = '40px';
        rotateRightBtn.style.height = '40px';
        rotateRightBtn.style.borderRadius = '50%';
        rotateRightBtn.style.backgroundColor = 'var(--primary-color)';
        rotateRightBtn.style.color = 'white';
        rotateRightBtn.style.border = 'none';
        rotateRightBtn.style.fontSize = '18px';
        rotateRightBtn.style.cursor = 'pointer';
        
        // Scale up button
        const scaleUpBtn = document.createElement('button');
        scaleUpBtn.className = 'sticker-control-btn';
        scaleUpBtn.innerHTML = '+';
        scaleUpBtn.title = 'Increase Size';
        scaleUpBtn.style.width = '40px';
        scaleUpBtn.style.height = '40px';
        scaleUpBtn.style.borderRadius = '50%';
        scaleUpBtn.style.backgroundColor = 'var(--primary-color)';
        scaleUpBtn.style.color = 'white';
        scaleUpBtn.style.border = 'none';
        scaleUpBtn.style.fontSize = '18px';
        scaleUpBtn.style.cursor = 'pointer';
        
        // Scale down button
        const scaleDownBtn = document.createElement('button');
        scaleDownBtn.className = 'sticker-control-btn';
        scaleDownBtn.innerHTML = '-';
        scaleDownBtn.title = 'Decrease Size';
        scaleDownBtn.style.width = '40px';
        scaleDownBtn.style.height = '40px';
        scaleDownBtn.style.borderRadius = '50%';
        scaleDownBtn.style.backgroundColor = 'var(--primary-color)';
        scaleDownBtn.style.color = 'white';
        scaleDownBtn.style.border = 'none';
        scaleDownBtn.style.fontSize = '18px';
        scaleDownBtn.style.cursor = 'pointer';
        
        // Add event listeners
        rotateLeftBtn.addEventListener('click', () => {
            stickerRotation -= 15;
            drawSticker();
        });
        
        rotateRightBtn.addEventListener('click', () => {
            stickerRotation += 15;
            drawSticker();
        });
        
        scaleUpBtn.addEventListener('click', () => {
            stickerScale += 0.1;
            drawSticker();
        });
        
        scaleDownBtn.addEventListener('click', () => {
            if (stickerScale > 0.3) {
                stickerScale -= 0.1;
                drawSticker();
            }
        });
        
        // Add buttons to container
        controlsContainer.appendChild(rotateLeftBtn);
        controlsContainer.appendChild(scaleDownBtn);
        controlsContainer.appendChild(scaleUpBtn);
        controlsContainer.appendChild(rotateRightBtn);
        
        // Add container to sticker container
        stickerContainer.appendChild(controlsContainer);
    }
}

// Apply selected sticker to the captured image
function applySticker(stickerType) {
    if (!stickerCanvas || !stickerContext) return;
    
    // Reset sticker properties
    stickerScale = 1.0;
    stickerRotation = 0;
    
    // Load the sticker image
    stickerImage = new Image();
    stickerImage.src = `assets/stickers/${stickerType}-sticker.png`;
    stickerImage.onload = () => {
        // Set initial position (center of canvas)
        stickerX = (stickerCanvas.width - stickerImage.width) / 2;
        stickerY = (stickerCanvas.height - stickerImage.height) / 2;
        
        // Draw the sticker
        drawSticker();
        
        // Enable dragging
        enableStickerDragging();
        
        // Show sticker controls
        const controlsContainer = document.querySelector('.sticker-controls');
        if (controlsContainer) {
            controlsContainer.style.display = 'flex';
        }
    };
}

// Draw the sticker on the canvas
function drawSticker() {
    if (!stickerContext || !stickerImage) return;
    
    // Clear the canvas
    stickerContext.clearRect(0, 0, stickerCanvas.width, stickerCanvas.height);
    
    // Save the current context state
    stickerContext.save();
    
    // Move to the center of the sticker
    stickerContext.translate(
        stickerX + (stickerImage.width * stickerScale) / 2,
        stickerY + (stickerImage.height * stickerScale) / 2
    );
    
    // Rotate the context
    stickerContext.rotate(stickerRotation * Math.PI / 180);
    
    // Draw the sticker (centered at the origin)
    stickerContext.drawImage(
        stickerImage,
        -(stickerImage.width * stickerScale) / 2,
        -(stickerImage.height * stickerScale) / 2,
        stickerImage.width * stickerScale,
        stickerImage.height * stickerScale
    );
    
    // Restore the context state
    stickerContext.restore();
}

// Enable dragging of the sticker
function enableStickerDragging() {
    if (!stickerCanvas) return;
    
    // Make canvas interactive
    stickerCanvas.style.pointerEvents = 'auto';
    
    // Remove existing event listeners to prevent duplicates
    stickerCanvas.removeEventListener('mousedown', startDrag);
    stickerCanvas.removeEventListener('mousemove', drag);
    stickerCanvas.removeEventListener('mouseup', endDrag);
    stickerCanvas.removeEventListener('mouseleave', endDrag);
    stickerCanvas.removeEventListener('touchstart', startDragTouch);
    stickerCanvas.removeEventListener('touchmove', dragTouch);
    stickerCanvas.removeEventListener('touchend', endDrag);
    
    // Mouse events for dragging
    stickerCanvas.addEventListener('mousedown', startDrag);
    stickerCanvas.addEventListener('mousemove', drag);
    stickerCanvas.addEventListener('mouseup', endDrag);
    stickerCanvas.addEventListener('mouseleave', endDrag);
    
    // Touch events for mobile
    stickerCanvas.addEventListener('touchstart', startDragTouch);
    stickerCanvas.addEventListener('touchmove', dragTouch);
    stickerCanvas.addEventListener('touchend', endDrag);
}

// Start dragging the sticker
function startDrag(e) {
    const rect = stickerCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate sticker bounds with rotation
    const centerX = stickerX + (stickerImage.width * stickerScale) / 2;
    const centerY = stickerY + (stickerImage.height * stickerScale) / 2;
    
    // Simple distance check from center (not perfect for rotated stickers but works well enough)
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const radius = Math.max(stickerImage.width, stickerImage.height) * stickerScale / 2;
    
    if (distance <= radius * 1.2) {
        isDragging = true;
        dragOffsetX = x - stickerX;
        dragOffsetY = y - stickerY;
    }
}

// Handle touch start for mobile
function startDragTouch(e) {
    e.preventDefault();
    const rect = stickerCanvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    // Calculate sticker bounds with rotation
    const centerX = stickerX + (stickerImage.width * stickerScale) / 2;
    const centerY = stickerY + (stickerImage.height * stickerScale) / 2;
    
    // Simple distance check from center
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const radius = Math.max(stickerImage.width, stickerImage.height) * stickerScale / 2;
    
    if (distance <= radius * 1.2) {
        isDragging = true;
        dragOffsetX = x - stickerX;
        dragOffsetY = y - stickerY;
    }
}

// Drag the sticker
function drag(e) {
    if (!isDragging) return;
    
    const rect = stickerCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    stickerX = x - dragOffsetX;
    stickerY = y - dragOffsetY;
    
    drawSticker();
}

// Handle touch move for mobile
function dragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const rect = stickerCanvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    stickerX = x - dragOffsetX;
    stickerY = y - dragOffsetY;
    
    drawSticker();
}

// End dragging the sticker
function endDrag() {
    isDragging = false;
}

// Merge sticker with the final image
function mergeSticker() {
    if (!stickerCanvas || !stickerContext || !stickerImage) return;
    
    const capturedImage = document.getElementById('capturedImage');
    if (!capturedImage) return;
    
    // Create a temporary canvas to merge the image and sticker
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = capturedImage.naturalWidth;
    tempCanvas.height = capturedImage.naturalHeight;
    
    const tempContext = tempCanvas.getContext('2d');
    
    // Draw the captured image
    tempContext.drawImage(capturedImage, 0, 0);
    
    // Calculate the scale factors
    const scaleX = capturedImage.naturalWidth / capturedImage.clientWidth;
    const scaleY = capturedImage.naturalHeight / capturedImage.clientHeight;
    
    // Save the context state
    tempContext.save();
    
    // Calculate the center of the sticker in the original image coordinates
    const scaledCenterX = (stickerX + (stickerImage.width * stickerScale) / 2) * scaleX;
    const scaledCenterY = (stickerY + (stickerImage.height * stickerScale) / 2) * scaleY;
    
    // Move to the center of where the sticker should be
    tempContext.translate(scaledCenterX, scaledCenterY);
    
    // Apply the same rotation
    tempContext.rotate(stickerRotation * Math.PI / 180);
    
    // Draw the sticker
    tempContext.drawImage(
        stickerImage,
        -(stickerImage.width * stickerScale * scaleX) / 2,
        -(stickerImage.height * stickerScale * scaleY) / 2,
        stickerImage.width * stickerScale * scaleX,
        stickerImage.height * stickerScale * scaleY
    );
    
    // Restore the context state
    tempContext.restore();
    
    // Update the captured image with the merged result
    capturedImage.src = tempCanvas.toDataURL('image/jpeg');
    
    // Clear the sticker canvas
    stickerContext.clearRect(0, 0, stickerCanvas.width, stickerCanvas.height);
    
    // Reset sticker variables
    stickerImage = null;
    stickerX = 0;
    stickerY = 0;
    stickerScale = 1.0;
    stickerRotation = 0;
    isDragging = false;
    
    // Hide sticker controls
    const controlsContainer = document.querySelector('.sticker-controls');
    if (controlsContainer) {
        controlsContainer.style.display = 'none';
    }
}

// Add a button to apply the sticker
function addApplyStickerButton() {
    const stickerContainer = document.querySelector('.sticker-container');
    if (!stickerContainer) return;
    
    // Check if button already exists
    let applyStickerBtn = document.getElementById('applyStickerBtn');
    if (!applyStickerBtn) {
        applyStickerBtn = document.createElement('button');
        applyStickerBtn.id = 'applyStickerBtn';
        applyStickerBtn.className = 'apply-sticker-btn';
        applyStickerBtn.textContent = 'Apply Sticker';
        applyStickerBtn.style.marginTop = '15px';
        applyStickerBtn.style.backgroundColor = 'var(--accent-color)';
        applyStickerBtn.style.color = 'white';
        applyStickerBtn.style.padding = '10px 20px';
        applyStickerBtn.style.border = 'none';
        applyStickerBtn.style.borderRadius = '5px';
        applyStickerBtn.style.cursor = 'pointer';
        applyStickerBtn.style.fontWeight = 'bold';
        applyStickerBtn.style.display = 'block';
        applyStickerBtn.style.margin = '15px auto 0';
        
        // Add hover effect
        applyStickerBtn.addEventListener('mouseover', () => {
            applyStickerBtn.style.backgroundColor = '#e86207';
        });
        
        applyStickerBtn.addEventListener('mouseout', () => {
            applyStickerBtn.style.backgroundColor = 'var(--accent-color)';
        });
        
        // Add click event to apply the sticker
        applyStickerBtn.addEventListener('click', () => {
            if (stickerImage) {
                mergeSticker();
                
                // Update social sharing buttons with new image
                const capturedImage = document.getElementById('capturedImage');
                if (capturedImage && typeof createSocialSharingButtons === 'function') {
                    createSocialSharingButtons(capturedImage.src);
                }
            }
        });
        
        stickerContainer.appendChild(applyStickerBtn);
    }
}

// Initialize sticker feature when an image is captured
document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            setTimeout(() => {
                setupStickerFeature();
                addApplyStickerButton();
            }, 500);
        });
    }
    
    // Clean up stickers when closing result container
    const closeResultBtn = document.getElementById('closeResultBtn');
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            // Clear sticker canvas
            if (stickerCanvas && stickerContext) {
                stickerContext.clearRect(0, 0, stickerCanvas.width, stickerCanvas.height);
            }
            
            // Reset sticker variables
            stickerImage = null;
            stickerX = 0;
            stickerY = 0;
            stickerScale = 1.0;
            stickerRotation = 0;
            isDragging = false;
        });
    }
});

// Generate a unique ID for file names
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Setup social sharing URLs
function setupSocialSharing(imageUrl) {
    const pageUrl = encodeURIComponent(window.location.href);
    const imageUrlEncoded = encodeURIComponent(imageUrl);
    const text = encodeURIComponent('Check out my photo from INVENTO 2K25 at DYPSN College!');
    
    return {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}&picture=${imageUrlEncoded}`,
        twitter: `https://twitter.com/intent/tweet?text=${text}&url=${pageUrl}`,
        whatsapp: `https://api.whatsapp.com/send?text=${text}%20${pageUrl}`
    };
}

// Add stickers that match the current theme
function addThemeStickers(theme) {
    const stickerOptions = document.querySelector('.sticker-options');
    if (!stickerOptions) return;
    
    // Add theme-specific sticker if it exists
    const themeSticker = document.querySelector(`.sticker[data-sticker="${theme}"]`);
    if (!themeSticker && theme !== 'default') {
        const newSticker = document.createElement('img');
        newSticker.src = `assets/stickers/${theme}-sticker.png`;
        newSticker.className = 'sticker';
        newSticker.dataset.sticker = theme;
        newSticker.alt = `${theme.charAt(0).toUpperCase() + theme.slice(1)} Sticker`;
        
        // Style the sticker
        newSticker.style.width = '50px';
        newSticker.style.height = '50px';
        newSticker.style.cursor = 'pointer';
        newSticker.style.border = '2px solid transparent';
        newSticker.style.borderRadius = '5px';
        newSticker.style.transition = 'transform 0.2s, border-color 0.2s';
        
        // Add hover effect
        newSticker.addEventListener('mouseover', () => {
            newSticker.style.transform = 'scale(1.1)';
            newSticker.style.borderColor = 'var(--secondary-color)';
        });
        
        newSticker.addEventListener('mouseout', () => {
            newSticker.style.transform = 'scale(1)';
            newSticker.style.borderColor = 'transparent';
        });
        
        // Add click event to apply sticker
        newSticker.addEventListener('click', () => {
            applySticker(theme);
        });
        
        stickerOptions.appendChild(newSticker);
    }
}

// Listen for theme changes
document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('.theme-btn');
    if (themeButtons.length > 0) {
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.dataset.theme;
                if (theme) {
                    addThemeStickers(theme);
                }
            });
        });
    }
});