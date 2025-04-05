// Download functionality for INVENTO 2K25 Photo Booth

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