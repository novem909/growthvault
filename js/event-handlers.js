/**
 * GrowthVault - Event Handlers
 * Central event delegation and handling
 */

export class EventHandlers {
    constructor(managers) {
        this.listManager = managers.listManager;
        this.uiManager = managers.uiManager;
        this.modalManager = managers.modalManager;
        this.firebaseManager = managers.firebaseManager;
        
        console.log('🎯 EventHandlers initialized');
    }

    /**
     * Initialize all event listeners
     */
    init() {
        this.setupFormHandler();
        this.setupClickDelegation();
        this.setupModalHandlers();
        this.setupKeyboardShortcuts();
        
        console.log('✅ Event handlers registered');
    }

    /**
     * Setup form submission handler
     */
    setupFormHandler() {
        const form = document.getElementById('itemForm');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmit();
            });
        }
    }

    /**
     * Setup click event delegation
     */
    setupClickDelegation() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            
            switch(action) {
                case 'delete-author':
                    e.stopPropagation();
                    this.handleDeleteAuthor(target.dataset.author);
                    break;
                    
                case 'open-author-popup':
                    this.handleOpenAuthorPopup(target.dataset.author);
                    break;
                    
                case 'delete-item':
                    e.stopPropagation();
                    this.handleDeleteItem(parseInt(target.dataset.itemId));
                    break;
                    
                case 'open-item-modal':
                    this.handleOpenItemModal(parseInt(target.dataset.itemId));
                    break;
                    
                case 'close-modal':
                    this.modalManager.closeContentModal();
                    break;
                    
                case 'close-popup':
                    this.modalManager.closeAuthorPopup();
                    break;
            }
        });
    }

    /**
     * Setup modal-specific handlers
     */
    setupModalHandlers() {
        // Close modal on backdrop click
        const contentModal = document.getElementById('contentModal');
        if (contentModal) {
            contentModal.addEventListener('click', (e) => {
                if (e.target === contentModal) {
                    this.modalManager.closeContentModal();
                }
            });
        }

        // Close author popup on backdrop click
        const authorPopup = document.getElementById('authorPopup');
        if (authorPopup) {
            authorPopup.addEventListener('click', (e) => {
                if (e.target === authorPopup) {
                    this.modalManager.closeAuthorPopup();
                }
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                if (document.getElementById('contentModal')?.style.display === 'flex') {
                    this.modalManager.closeContentModal();
                } else if (document.getElementById('authorPopup')?.style.display === 'flex') {
                    this.modalManager.closeAuthorPopup();
                }
            }

            // Ctrl+Z / Cmd+Z to undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                // Only if not in an input field
                if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                    e.preventDefault();
                    this.handleUndo();
                }
            }
        });
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit() {
        const authorInput = document.getElementById('authorInput');
        const titleInput = document.getElementById('titleInput');
        const textInput = document.getElementById('textInput');
        const imageInput = document.getElementById('imageInput');

        const itemData = {
            author: authorInput?.value.trim() || '',
            title: titleInput?.value.trim() || '',
            text: textInput?.value || '',
            imageFile: imageInput?.files?.[0] || null
        };

        const result = await this.listManager.addItem(itemData);

        if (result.success) {
            this.uiManager.clearForm();
            this.uiManager.updateStorageInfo();
            
            if (typeof showToast === 'function') {
                showToast('Item added successfully!', 'success');
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(result.error || 'Failed to add item', 'error');
            }
        }
    }

    /**
     * Handle delete author
     * @param {string} author - Author name
     */
    handleDeleteAuthor(author) {
        const confirmMessage = `Delete all items by "${author}"?`;
        
        if (confirm(confirmMessage)) {
            const result = this.listManager.deleteAuthor(author);
            
            if (result.success) {
                this.uiManager.updateStorageInfo();
                
                if (typeof showToast === 'function') {
                    showToast(`Deleted ${result.count} items`, 'default');
                }
            }
        }
    }

    /**
     * Handle open author popup
     * @param {string} author - Author name
     */
    handleOpenAuthorPopup(author) {
        this.modalManager.openAuthorPopup(author);
    }

    /**
     * Handle delete item
     * @param {number} itemId - Item ID
     */
    handleDeleteItem(itemId) {
        const result = this.listManager.deleteItem(itemId);
        
        if (result.success) {
            this.uiManager.updateStorageInfo();
        }
    }

    /**
     * Handle open item modal
     * @param {number} itemId - Item ID
     */
    handleOpenItemModal(itemId) {
        this.modalManager.openContentModal(itemId);
    }

    /**
     * Handle undo
     */
    handleUndo() {
        const result = this.listManager.undo();
        
        if (result.success) {
            this.uiManager.showUndoNotification(result.action, result.data);
            this.uiManager.updateStorageInfo();
        } else {
            if (typeof showToast === 'function') {
                showToast('Nothing to undo', 'default');
            }
        }
    }

    /**
     * Handle export data
     */
    handleExportData() {
        this.listManager.exportData();
        
        if (typeof showToast === 'function') {
            showToast('Data exported', 'success');
        }
    }

    /**
     * Handle import data
     * @param {File} file - JSON file
     */
    async handleImportData(file) {
        const result = await this.listManager.importData(file);
        
        if (result.success) {
            this.uiManager.updateStorageInfo();
            
            if (typeof showToast === 'function') {
                showToast(`Imported ${result.itemCount} items`, 'success');
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(result.error || 'Import failed', 'error');
            }
        }
    }

    /**
     * Handle clear all data
     */
    handleClearAllData() {
        const confirmMessage = 'Clear ALL data? This cannot be undone.';
        
        if (confirm(confirmMessage)) {
            const result = this.listManager.clearAllData();
            
            if (result.success) {
                this.uiManager.updateStorageInfo();
                
                if (typeof showToast === 'function') {
                    showToast('All data cleared', 'default');
                }
            }
        }
    }

    /**
     * Handle authentication
     */
    async handleAuth() {
        if (this.firebaseManager) {
            await this.firebaseManager.handleAuth();
        } else {
            if (typeof showToast === 'function') {
                showToast('Firebase not initialized', 'error');
            }
        }
    }
}

export default EventHandlers;

