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
import { PersistenceManager } from './persistence-manager.js';

console.log('🚀 GrowthVault loading...');

class GrowthVaultApp {
    constructor() {
        // Initialize core managers
        this.stateManager = new StateManager();
        this.storageManager = new StorageManager(CONFIG.STORAGE_KEY);
        
        // Initialize Firebase Manager (dependencies injected later to resolve cycles)
        this.firebaseManager = new FirebaseManager(this.stateManager, null, null);
        
        // Initialize Persistence Manager (Orchestrator)
        this.persistenceManager = new PersistenceManager(this.storageManager, this.firebaseManager, this.stateManager);
        
        // Initialize List Manager with Persistence Manager
        this.listManager = new ListManager(this.stateManager, this.persistenceManager);
        
        // Initialize UI Managers
        this.uiManager = new UIManager(this.stateManager, this.listManager);
        this.modalManager = new ModalManager(this.stateManager, this.listManager);
        
        // Complete dependency injection
        this.firebaseManager.setListManager(this.listManager);
        this.firebaseManager.uiManager = this.uiManager;
        
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
        
        // Load saved data from storage (IndexedDB or localStorage)
        const loadResult = await this.listManager.load();
        if (loadResult.success) {
            console.log('📥 Loaded data from storage');
        }

        // Initialize event handlers
        this.eventHandlers.init();

        // Initial render
        this.uiManager.renderItems();
        await this.uiManager.updateStorageInfo();

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
        window.deleteCurrentModalItem = async () => {
            await this.modalManager.deleteCurrentModalItem();
        };

        window.closeModal = async () => {
            await this.modalManager.closeContentModal();
        };

        // Author popup handlers
        window.deleteAuthorFromPopup = async () => {
            await this.modalManager.deleteAuthorFromPopup();
        };

        window.closeAuthorPopup = () => {
            this.modalManager.closeAuthorPopup();
        };

        window.openAuthorPopup = (author) => {
            this.modalManager.openAuthorPopup(author);
        };

        window.deleteAuthor = async (author, event) => {
            if (event) event.stopPropagation();
            await this.eventHandlers.handleDeleteAuthor(author);
        };

        window.openModal = (itemId) => {
            this.modalManager.openContentModal(itemId);
        };

        // listBuilder object for backward compatibility
        window.listBuilder = {
            exportData: () => {
                this.eventHandlers.handleExportData();
            },
            clearAllData: async () => {
                await this.eventHandlers.handleClearAllData();
            },
            saveToStorage: async () => {
                await this.listManager.save();
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

