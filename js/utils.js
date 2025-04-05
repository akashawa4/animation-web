// Utility functions

// Generate random fun messages
const funMessages = [
    "You look good but something is missing!",
    "Strike a pose, you're a star!",
    "Smile like you just won the hackathon!",
    "Show your INVENTO spirit!",
    "Tech genius in the frame!",
    "Future innovator detected!",
    "You're looking INVENTO-ready!",
    "That's a profile picture worthy pose!",
    "Say 'Innovation'!",
    "You're making DYPSN proud!"
];


// Get random fun message
function getRandomFunMessage() {
    const randomIndex = Math.floor(Math.random() * funMessages.length);
    return funMessages[randomIndex];
}

// Format countdown timer
function formatCountdown(distance) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Update countdown timer
function updateCountdown() {
    const countdownElement = document.getElementById('countdown');
    // Set the date for INVENTO 2K25 (example date - adjust as needed)
    const eventDate = new Date("March 15, 2025 09:00:00").getTime();
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = eventDate - now;
        
        if (distance < 0) {
            clearInterval(interval);
            countdownElement.innerHTML = "INVENTO 2K25 is here!";
        } else {
            countdownElement.innerHTML = `Event starts in: ${formatCountdown(distance)}`;
        }
    }, 1000);
}

// Generate a unique ID for images
function generateUniqueId() {
    return 'invento-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
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

// Create a temporary URL for downloading
function createDownloadLink(imageDataUrl, fileName) {
    const blob = dataURLtoBlob(imageDataUrl);
    return URL.createObjectURL(blob);
}