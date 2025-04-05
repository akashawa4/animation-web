// Firebase configuration for INVENTO 2K25 Photo Booth
// This handles image storage and QR code download links

// Initialize Firebase for image storage and QR code downloads
function initFirebase() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAv5wxTWeks_iL4BVwDEqEJqNoByxMOcj4",
        authDomain: "animation-web-7b476.firebaseapp.com",
        projectId: "animation-web-7b476",
        storageBucket: "animation-web-7b476.appspot.com", // Fixed storage bucket URL
        messagingSenderId: "517706026983",
        appId: "1:517706026983:web:de4a69cb39552ea0fdb742"
    };
    
    console.log('Initializing Firebase in firebase-config.js');
    
    // Check if we're using the module version or global version
    if (typeof firebase !== 'undefined') {
        // Using global firebase
        console.log('Using global Firebase object');
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
            firebase.app(); // If already initialized, use that one
        }
        
        // Initialize storage and make it available globally
        window.firebaseStorage = firebase.storage();
        window.firebaseDB = firebase.firestore();
    } else {
        console.log('Global Firebase object not found, might be using module version');
        // The module version should already be initialized in the HTML
        // Just make sure we have a reference to it
        if (window.storage && !window.firebaseStorage) {
            window.firebaseStorage = window.storage;
        }
        if (window.db && !window.firebaseDB) {
            window.firebaseDB = window.db;
        }
    }
    
    // Set up storage rules for temporary files
    setupStorageCleanup();
    
    console.log('Firebase initialized for image storage and QR downloads');
    console.log('Firebase storage available:', window.firebaseStorage ? 'Yes' : 'No');
}

// Set up automatic cleanup of old files
function setupStorageCleanup() {
    // This would typically be done with a Cloud Function
    // For client-side, we'll just log that this should be implemented server-side
    console.log('Note: For production, implement server-side cleanup of old QR download files');
    
    // In a real implementation, you would have a Cloud Function like:
    /*
    exports.cleanupOldFiles = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
        const storage = admin.storage();
        const bucket = storage.bucket();
        
        // Get files older than 24 hours
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 1);
        
        const [files] = await bucket.getFiles({ prefix: 'qr_downloads/' });
        
        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const created = new Date(metadata.timeCreated);
            
            if (created < cutoff) {
                await file.delete();
                console.log(`Deleted old file: ${file.name}`);
            }
        }
        
        return null;
    });
    */
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', initFirebase);