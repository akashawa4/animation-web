// AnimeGAN integration for INVENTO 2K25 Photo Booth
const animeGanModule = (function() {
    // Convert data URL to Blob for upload
    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
    
    // Upload image to temporary storage and get URL
    async function uploadImageAndGetURL(imageDataUrl) {
        try {
            // Create a unique filename
            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileName = `temp_${timestamp}_${randomString}.jpg`;
            
            // Get Firebase storage reference
            const storage = window.firebaseStorage;
            if (!storage) {
                throw new Error("Firebase storage not initialized");
            }
            
            // Create a reference to the file location in Firebase
            const storageRef = storage.ref(`temp/${fileName}`);
            
            // Convert data URL to blob format for upload
            const blob = dataURLtoBlob(imageDataUrl);
            
            // Upload the image
            await storageRef.put(blob);
            
            // Get the download URL
            const downloadURL = await storageRef.getDownloadURL();
            
            return downloadURL;
        } catch (error) {
            console.error("Error uploading temporary image:", error);
            throw error;
        }
    }
    
    // Apply AnimeGAN effect to image
    async function applyAnimeEffect(imageDataUrl) {
        try {
            // Show loading indicator
            const loadingMessage = document.createElement('div');
            loadingMessage.id = 'animeLoadingMessage';
            loadingMessage.textContent = 'Transforming image into anime style...';
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
            
            // First upload the image to get a URL
            const imageUrl = await uploadImageAndGetURL(imageDataUrl);
            
            // Call the AnimeGAN endpoint
            const response = await fetch('/animegan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageUrl })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process image');
            }
            
            const result = await response.json();
            
            // Remove loading indicator
            document.body.removeChild(loadingMessage);
            
            // Return the anime-style image URL
            return result.output;
        } catch (error) {
            console.error('Error applying anime effect:', error);
            
            // Remove loading indicator if it exists
            const loadingMessage = document.getElementById('animeLoadingMessage');
            if (loadingMessage) {
                document.body.removeChild(loadingMessage);
            }
            
            throw error;
        }
    }
    
    // Public API
    return {
        applyAnimeEffect: applyAnimeEffect
    };
})();

// Make the module available globally
window.animeGanModule = animeGanModule;