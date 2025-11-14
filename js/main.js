/**
 * GrowthVault - Main Application Entry Point
 * ES Module that initializes the complete application
 */

import { CONFIG } from './config.js';
import { StateManager } from './state-manager.js';
import { StorageManager } from './storage-manager.js';
import { ListManager } from './list-manager.js';
import { UIManager } from './ui-manager.js';
import { ModalManager } from './modal-manager.js';
import { EventHandlers } from './event-handlers.js';
import { FirebaseManager } from './firebase-manager.js';

console.log('🚀 GrowthVault loading...');

class GrowthVaultApp {
    constructor() {
        // Initialize core managers
        this.stateManager = new StateManager();
        this.storageManager = new StorageManager(CONFIG.STORAGE_KEY);
        this.listManager = new ListManager(this.stateManager, this.storageManager);
        this.uiManager = new UIManager(this.stateManager, this.listManager);
        this.modalManager = new ModalManager(this.stateManager, this.listManager);
        this.firebaseManager = new FirebaseManager(this.stateManager, this.listManager);
        
        // Link Firebase Manager to List Manager for auto-sync
        this.listManager.setFirebaseManager(this.firebaseManager);
        
        // Initialize event handlers
        this.eventHandlers = new EventHandlers({
            listManager: this.listManager,
            uiManager: this.uiManager,
            modalManager: this.modalManager,
            firebaseManager: this.firebaseManager
        });
        
        console.log('✅ All managers initialized');
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🔧 Initializing application...');
        
        // Load saved data from localStorage
        const loadResult = this.listManager.load();
        if (loadResult.success) {
            console.log('📥 Loaded data from localStorage');
        }

        // Initialize event handlers
        this.eventHandlers.init();

        // Initial render
        this.uiManager.renderItems();
        this.uiManager.updateStorageInfo();

        // Initialize theme
        if (typeof initializeTheme === 'function') {
            initializeTheme();
        }

        // Setup global functions for backward compatibility
        this.setupGlobalFunctions();

        console.log('✅ GrowthVault initialized successfully');
        
        if (typeof showToast === 'function') {
            showToast('GrowthVault loaded', 'success');
        }
    }

    /**
     * Setup global functions for inline event handlers
     * (Temporary - will be removed in Phase 3)
     */
    setupGlobalFunctions() {
        // Auth handler
        window.handleAuth = async () => {
            await this.eventHandlers.handleAuth();
        };

        // Import handler
        window.handleImport = async (input) => {
            const file = input.files?.[0];
            if (file) {
                await this.eventHandlers.handleImportData(file);
            }
        };

        // Modal handlers
        window.deleteCurrentModalItem = () => {
            this.modalManager.deleteCurrentModalItem();
        };

        window.closeModal = () => {
            this.modalManager.closeContentModal();
        };

        // Author popup handlers
        window.deleteAuthorFromPopup = () => {
            this.modalManager.deleteAuthorFromPopup();
        };

        window.closeAuthorPopup = () => {
            this.modalManager.closeAuthorPopup();
        };

        window.openAuthorPopup = (author) => {
            this.modalManager.openAuthorPopup(author);
        };

        window.deleteAuthor = (author, event) => {
            if (event) event.stopPropagation();
            this.eventHandlers.handleDeleteAuthor(author);
        };

        window.openModal = (itemId) => {
            this.modalManager.openContentModal(itemId);
        };

        // listBuilder object for backward compatibility
        window.listBuilder = {
            exportData: () => {
                this.eventHandlers.handleExportData();
            },
            clearAllData: () => {
                this.eventHandlers.handleClearAllData();
            },
            // Expose managers for debugging
            _managers: {
                state: this.stateManager,
                storage: this.storageManager,
                list: this.listManager,
                ui: this.uiManager,
                modal: this.modalManager,
                firebase: this.firebaseManager
            }
        };

        console.log('🔌 Global functions registered for backward compatibility');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM Content Loaded');
    
    try {
        window.app = new GrowthVaultApp();
        await window.app.init();
        console.log('🎉 Application ready!');
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to initialize app: ' + error.message, 'error');
        }
    }
});

