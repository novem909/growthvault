/**
 * UI Utility Functions
 * Toast notifications, modals, theme toggle, and other UI helpers
 */

// Toast Notification System
function showToast(message, type = 'default') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Dark Mode Toggle
function toggleDarkMode() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    if (newTheme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }
}

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    if (savedTheme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }
}

// Scroll to Form (FAB action)
function scrollToForm() {
    document.getElementById('itemForm').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    document.getElementById('authorInput').focus();
}

// Image Zoom Functions
function openImageZoom(imageSrc) {
    const overlay = document.getElementById('imageZoomOverlay');
    const zoomedImage = document.getElementById('zoomedImage');
    zoomedImage.src = imageSrc;
    overlay.classList.add('active');

    // Close on ESC key
    document.addEventListener('keydown', handleZoomEscKey);
}

function closeImageZoom(event) {
    if (event.target === event.currentTarget || event.type === 'keydown') {
        const overlay = document.getElementById('imageZoomOverlay');
        overlay.classList.remove('active');
        document.removeEventListener('keydown', handleZoomEscKey);
    }
}

function handleZoomEscKey(e) {
    if (e.key === 'Escape') {
        closeImageZoom(e);
    }
}

// Editable Text Elements
function makeEditable(element) {
    if (element.classList.contains('editing')) return;

    const originalText = element.textContent;
    const itemId = element.dataset.itemId ? parseInt(element.dataset.itemId) : null;
    
    element.classList.add('editing');
    element.contentEditable = true;
    element.focus();

    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    function finishEditing() {
        element.classList.remove('editing');
        element.contentEditable = false;
        element.blur();

        const newText = element.textContent.trim();

        // If editing an item title (has itemId), update the item
        if (itemId && window.app) {
            const state = window.app.stateManager.getState();
            const item = state.items.find(i => i.id === itemId);
            
            if (item && item.title !== newText) {
                const updatedItems = state.items.map(i => 
                    i.id === itemId ? { ...i, title: newText || 'Untitled' } : i
                );
                
                window.app.stateManager.setState({ items: updatedItems });
                window.app.listManager.save();
                console.log('✏️  Updated item title:', itemId, newText);
            }
        } 
        // Otherwise, save page titles
        else if (window.listBuilder) {
            window.listBuilder.saveToStorage();
        }

        // Clean up event listeners
        element.removeEventListener('keydown', handleKeydown);
        element.removeEventListener('input', handleInput);
    }

    function handleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditing();
        } else if (e.key === 'Escape') {
            element.textContent = originalText;
            finishEditing();
        }
    }

    function handleInput(e) {
        // Remove any line breaks
        const text = element.textContent.replace(/\n/g, ' ').replace(/\r/g, ' ');
        if (text !== element.textContent) {
            element.textContent = text;
            // Restore cursor position at end
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    element.addEventListener('blur', finishEditing, { once: true });
    element.addEventListener('keydown', handleKeydown);
    element.addEventListener('input', handleInput);
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save indicator
function showSaveIndicator() {
    const indicator = document.getElementById('storageInfo');
    if (indicator) {
        indicator.innerHTML = '<span class="auto-save-indicator">💾 Saved</span>';
        setTimeout(() => {
            indicator.innerHTML = '<span class="auto-save-indicator">🟢 Auto-saved locally</span>';
        }, 2000);
    }
}

// PWA Install Prompt (Disabled)
// Uncomment to re-enable the install app button
/*
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    if (!deferredPrompt) return;

    const installButton = document.createElement('button');
    installButton.className = 'install-prompt';
    installButton.textContent = '📱 Install App';
    installButton.onclick = async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.remove();
    };

    document.body.appendChild(installButton);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
}
*/

// Format Text (for rich text editing)
function formatText(command) {
    document.execCommand(command, false, null);
}

// HTML Escape utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});
