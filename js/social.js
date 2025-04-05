// Social media sharing functionality for INVENTO 2K25 Photo Booth

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
        socialContainer.style.marginBottom = '15px';
        
        // Insert before the close button
        const closeBtn = document.getElementById('closeResultBtn');
        if (closeBtn) {
            resultContainer.insertBefore(socialContainer, closeBtn);
        } else {
            resultContainer.appendChild(socialContainer);
        }
    }
}