// Theme management for INVENTO 2K25 Photo Booth

// Initialize theme selector
function initThemeSelector() {
    const controlsSection = document.querySelector('.controls');
    if (!controlsSection) return;
    
    // Create theme selector container
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
        <h3>Choose Background Theme</h3>
        <div class="theme-options">
            <button class="theme-btn active" data-theme="default">Default</button>
            <button class="theme-btn" data-theme="tech">Tech</button>
            <button class="theme-btn" data-theme="futuristic">Futuristic</button>
            <button class="theme-btn" data-theme="celebration">Celebration</button>
        </div>
    `;
    
    // Style the theme selector
    themeSelector.style.marginBottom = '20px';
    themeSelector.style.textAlign = 'center';
    
    // Style the heading
    const heading = themeSelector.querySelector('h3');
    heading.style.fontSize = '1.1rem';
    heading.style.marginBottom = '10px';
    heading.style.color = 'var(--text-color)';
    
    // Style the theme options container
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

// Initialize theme selector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
});