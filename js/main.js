/**
 * GrowthVault - Main Application Entry Point
 * ES Module that initializes the application
 */

console.log('🚀 GrowthVault loading...');

// Initialize theme from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    // Initialize theme (function from ui-utils.js)
    if (typeof initializeTheme === 'function') {
        initializeTheme();
        console.log('✅ Theme initialized');
    } else {
        console.warn('⚠️  initializeTheme not found in ui-utils.js');
    }
    
    // Log available global functions for debugging
    console.log('📋 Available global functions:', {
        showToast: typeof showToast,
        toggleDarkMode: typeof toggleDarkMode,
        scrollToForm: typeof scrollToForm,
        makeEditable: typeof makeEditable,
        openImageZoom: typeof openImageZoom,
        closeImageZoom: typeof closeImageZoom,
        formatText: typeof formatText
    });
    
    // Display initialization notice
    if (typeof showToast === 'function') {
        showToast('Application initializing - Limited functionality', 'default');
    }
    
    console.log('⚠️  Phase 1: Basic module loaded. Application logic not yet migrated.');
    console.log('📝 Next: Phase 2 will extract VisualListBuilder and full functionality');
});

// Temporary stub for missing functions to prevent console errors
window.handleAuth = function() {
    console.warn('handleAuth() not yet implemented - Phase 2');
    if (typeof showToast === 'function') {
        showToast('Authentication coming soon', 'default');
    }
};

window.handleImport = function(input) {
    console.warn('handleImport() not yet implemented - Phase 2');
    if (typeof showToast === 'function') {
        showToast('Import feature coming soon', 'default');
    }
};

window.deleteCurrentModalItem = function() {
    console.warn('deleteCurrentModalItem() not yet implemented - Phase 2');
};

window.closeModal = function() {
    console.warn('closeModal() not yet implemented - Phase 2');
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.deleteAuthorFromPopup = function() {
    console.warn('deleteAuthorFromPopup() not yet implemented - Phase 2');
};

window.closeAuthorPopup = function() {
    console.warn('closeAuthorPopup() not yet implemented - Phase 2');
    const popup = document.getElementById('authorPopup');
    if (popup) {
        popup.style.display = 'none';
    }
};

// Temporary stub for listBuilder object
window.listBuilder = {
    exportData: function() {
        console.warn('listBuilder.exportData() not yet implemented - Phase 2');
        if (typeof showToast === 'function') {
            showToast('Export feature coming soon', 'default');
        }
    },
    clearAllData: function() {
        console.warn('listBuilder.clearAllData() not yet implemented - Phase 2');
        if (typeof showToast === 'function') {
            showToast('Clear all feature coming soon', 'default');
        }
    }
};

console.log('✅ Phase 1 module initialization complete');
console.log('📌 Stub functions created for missing functionality');

