// QR Code handling

let qrCodeInstance = null;

// Generate QR code for image download
async function generateQRCode(imageDataUrl) {
    const qrcodeElement = document.getElementById('qrcode');
    const qrContainer = document.querySelector('.qr-container');
    
    if (!qrcodeElement || !qrContainer) {
        console.error('QR code element or container not found');
        return;
    }
    
    // Show loading indicator
    qrcodeElement.innerHTML = '<div class="qr-loading">Generating download link...</div>';
    
    try {
        // Instead of using Firebase, we'll create a local download URL
        const downloadUrl = await createLocalDownloadUrl(imageDataUrl);
        
        if (!downloadUrl) {
            throw new Error('Failed to generate local download URL');
        }
        
        console.log('Generated local download URL for QR code:', downloadUrl);
        
        // Clear previous QR code
        qrcodeElement.innerHTML = '';
        
        // Make sure QRCode library is available
        if (typeof QRCode !== 'function') {
            console.error('QRCode library not loaded, attempting to load it');
            await loadQRCodeLibrary();
            
            if (typeof QRCode !== 'function') {
                throw new Error('QRCode library not loaded');
            }
        }
        
        // Create new QR code with the download URL
        try {
            // Destroy previous instance if it exists
            if (qrCodeInstance) {
                qrCodeInstance.clear();
            }
            
            qrCodeInstance = new QRCode(qrcodeElement, {
                text: downloadUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (qrError) {
            console.error('Error creating QR code instance:', qrError);
            // Fallback to canvas method if available
            if (typeof QRCode.toCanvas === 'function') {
                QRCode.toCanvas(qrcodeElement, downloadUrl, {
                    width: 200,
                    height: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
            } else {
                throw qrError;
            }
        }
        
        // Add scan instructions
        // Remove existing instructions if any
        const existingInstructions = qrContainer.querySelector('.qr-instructions');
        if (existingInstructions) {
            qrContainer.removeChild(existingInstructions);
        }
        
        const instructionsElement = document.createElement('div');
        instructionsElement.className = 'qr-instructions';
        instructionsElement.innerHTML = `
            <p>Scan with your phone to download</p>
            <p class="qr-expiry">Open in browser to download</p>
        `;
        qrContainer.appendChild(instructionsElement);
        
        // Add direct download button for desktop users
        addDirectDownloadButton(qrContainer, downloadUrl);
        
        return downloadUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        qrcodeElement.innerHTML = `<div class="qr-error">Failed to generate QR code: ${error.message}. Please try again.</div>`;
        
        // Add a retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.className = 'retry-qr-btn';
        retryButton.style.backgroundColor = '#f97316';
        retryButton.style.color = 'white';
        retryButton.style.padding = '8px 16px';
        retryButton.style.border = 'none';
        retryButton.style.borderRadius = '4px';
        retryButton.style.cursor = 'pointer';
        retryButton.style.marginTop = '10px';
        retryButton.onclick = () => {
            generateQRCode(imageDataUrl);
        };
        qrcodeElement.appendChild(retryButton);
        
        return null;
    }
}

// Create a local download URL for the image
async function createLocalDownloadUrl(imageDataUrl) {
    try {
        // Method 1: Use a data URL directly (works for smaller images)
        if (imageDataUrl.length < 2000) {
            // For small images, we can use the data URL directly in the QR code
            return imageDataUrl;
        }
        
        // Method 2: Create a downloadable HTML page with the image embedded
        const timestamp = new Date().getTime();
        const fileName = `invento2k25_${timestamp}.jpg`;
        
        // Create an HTML page that will display the image and offer download
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>INVENTO 2K25 - Download Image</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
        }
        img {
            max-width: 100%;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .download-btn {
            background-color: #2196F3;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
        .download-btn:hover {
            background-color: #0b7dda;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAyCAYAAAAZUZThAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMy0wMS0xNVQxNDo1Nzo0OCswNTozMCIgeG1wOk1vZGlmeURhdGU9IjIwMjMtMDEtMTVUMTU6MDE6MzkrMDU6MzAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDEtMTVUMTU6MDE6MzkrMDU6MzAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YzI0MGRmNzQtY2FmMy00MjQx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" alt="INVENTO 2K25 Logo" class="logo">
        <h1>INVENTO 2K25 Photo Download</h1>
        <img src="${imageDataUrl}" alt="Your captured image" id="downloadImage">
        <br>
        <a href="${imageDataUrl}" download="${fileName}" class="download-btn">Download Image</a>
    </div>
    <script>
        // Auto-download for mobile devices
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) {
            // For non-iOS devices, we can try auto-download
            setTimeout(() => {
                const link = document.querySelector('.download-btn');
                if (link) link.click();
            }, 1000);
        }
    </script>
</body>
</html>
`;

        // Convert the HTML to a Blob
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        
        // Create a URL for the HTML Blob
        const htmlUrl = URL.createObjectURL(htmlBlob);
        
        return htmlUrl;
    } catch (error) {
        console.error('Error creating local download URL:', error);
        return null;
    }
}

// Load QRCode library dynamically if needed
async function loadQRCodeLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof QRCode === 'function') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
        script.onload = () => {
            console.log('QRCode library loaded dynamically');
            resolve();
        };
        script.onerror = (error) => {
            console.error('Failed to load QRCode library:', error);
            reject(new Error('Failed to load QRCode library'));
        };
        document.head.appendChild(script);
    });
}

// Convert data URL to Blob
function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

// Add a direct download button below the QR code
function addDirectDownloadButton(container, downloadUrl) {
    // Check if button already exists
    let directDownloadBtn = document.getElementById('directDownloadBtn');
    if (directDownloadBtn) {
        directDownloadBtn.href = downloadUrl;
        return;
    }
    
    // Create button
    directDownloadBtn = document.createElement('a');
    directDownloadBtn.id = 'directDownloadBtn';
    directDownloadBtn.className = 'direct-download-btn';
    directDownloadBtn.href = downloadUrl;
    directDownloadBtn.textContent = 'Direct Download';
    directDownloadBtn.target = '_blank';
    directDownloadBtn.rel = 'noopener noreferrer';
    
    // Add to container
    container.appendChild(directDownloadBtn);
}

// Handle QR code scanning for user check-in
function setupQRScanner() {
    const scanQrBtn = document.getElementById('scanQrBtn');
    
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', () => {
            // In a real implementation, you would use a library like jsQR or a dedicated QR scanner
            // For this demo, we'll simulate a QR scan with a prompt
            const scannedName = prompt("Simulating QR scan. Enter your name:");
            if (scannedName) {
                document.getElementById('userName').value = scannedName;
                updateWelcomeMessage(scannedName);
            }
        });
    }
}

// Create a shareable link for the image
function createShareableLink(imageDataUrl) {
    // Create a unique ID for the image
    const imageId = generateUniqueId();
    // Create a download link using our local method
    return createLocalDownloadUrl(imageDataUrl);
}

// Generate a unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Export functions for use in other modules
window.qrcodeModule = {
    generateQRCode,
    setupQRScanner,
    createShareableLink
};