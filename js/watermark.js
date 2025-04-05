// Watermark functionality for captured images

// Apply watermarks to the canvas
function applyWatermarks(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save the current canvas state
    ctx.save();

    // Add header watermark
    const headerHeight = 80; // Increased height for better spacing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Added opacity for better visibility
    ctx.fillRect(0, 0, canvas.width, headerHeight);

    // Add footer watermark
    const footerHeight = 80; // Increased height for better spacing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Added opacity for better visibility
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

    // Add text content immediately
    addTextWatermarks(ctx, canvas.width, canvas.height, headerHeight, footerHeight);

    // Add logos with proper promise handling
    addLogoWatermarks(ctx, canvas.width, headerHeight, footerHeight);
}

// Function to add text watermarks
function addTextWatermarks(ctx, width, height, headerHeight, footerHeight) {
    // Helper function to add text shadow
    function addTextWithShadow(text, x, y, fontSize, isBold = false, isItalic = false, color = '#ffffff') {
        ctx.save();
        let fontStyle = '';
        if (isBold) fontStyle += 'bold ';
        if (isItalic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${fontSize}px Arial`;
        
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    // Center text alignment
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    // Header Section
    // GDG logo with exact Google colors
    const gdgX = 120; // Position for GDG text
    const gdgY = headerHeight / 2;
    
    // Add "GDG" text with Google colors
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4285F4'; // Google Blue
    ctx.fillText('G', gdgX - 20, gdgY);
    ctx.fillStyle = '#EA4335'; // Google Red
    ctx.fillText('D', gdgX, gdgY);
    ctx.fillStyle = '#FBBC05'; // Google Yellow
    ctx.fillText('G', gdgX + 20, gdgY);
    ctx.restore();

    // Event name in center of header
    addTextWithShadow('INVENTO 2K25', width / 2, headerHeight / 2, 24, true, false, '#f97316');

    // Footer Section
    // College name
    addTextWithShadow('DR. D.Y. PATIL PRATISHTHAN\'S COLLEGE OF ENGINEERING', width / 2, height - footerHeight / 2 - 15, 16, true, '#f97316');
    
    // Tagline
    addTextWithShadow('Innovate • Create • Inspire', width / 2, height - footerHeight / 2 + 15, 14, false, true, '#f97316');
}

// Function to add logo watermarks with proper promise handling
function addLogoWatermarks(ctx, width, headerHeight, footerHeight) {
    // Create promises for image loading
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    // Load both logos
    Promise.all([
        loadImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfqKbgBXoM49QbsjpEPfQT_7osjXNAfhxYNg&s'),
        loadImage('https://developers.google.com/community/gdg/images/logo-lockup-gdg-horizontal_720.png')
    ]).then(([leftLogo, rightLogo]) => {
        // Draw logos in header
        const logoHeight = 60;
        const leftLogoWidth = logoHeight;
        const rightLogoWidth = (rightLogo.width / rightLogo.height) * logoHeight;
        
        // Draw left logo in header
        ctx.drawImage(leftLogo, 15, (headerHeight - logoHeight) / 2, leftLogoWidth, logoHeight);
        
        // Draw right logo in header
        ctx.drawImage(rightLogo, width - rightLogoWidth - 15, (headerHeight - logoHeight) / 2, rightLogoWidth, logoHeight);
        
        // Draw left logo in footer
        ctx.drawImage(leftLogo, 15, ctx.canvas.height - footerHeight + (footerHeight - logoHeight) / 2, leftLogoWidth, logoHeight);
        
        // Draw right logo in footer
        ctx.drawImage(rightLogo, width - rightLogoWidth - 15, ctx.canvas.height - footerHeight + (footerHeight - logoHeight) / 2, rightLogoWidth, logoHeight);
    }).catch(error => {
        console.error('Error loading watermark logos:', error);
    });
}

// Make functions available globally
window.applyWatermarks = applyWatermarks;