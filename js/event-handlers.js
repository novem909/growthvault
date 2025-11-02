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
        this.setupChangeHandlers();
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
                case 'auth':
                    this.handleAuth();
                    break;
                    
                case 'toggle-theme':
                    if (typeof toggleDarkMode === 'function') {
                        toggleDarkMode();
                    }
                    break;
                    
                case 'make-editable':
                    if (typeof makeEditable === 'function') {
                        makeEditable(target);
                    }
                    break;
                    
                case 'export-data':
                    this.handleExportData();
                    break;
                    
                case 'clear-all':
                    this.handleClearAllData();
                    break;
                    
                case 'delete-modal-item':
                    this.handleDeleteCurrentModalItem();
                    break;
                    
                case 'close-modal':
                    this.modalManager.closeContentModal();
                    break;
                    
                case 'format-text':
                    if (target.dataset.format && typeof formatText === 'function') {
                        formatText(target.dataset.format);
                    }
                    break;
                    
                case 'delete-author-from-popup':
                    this.handleDeleteAuthorFromPopup();
                    break;
                    
                case 'close-popup':
                    this.modalManager.closeAuthorPopup();
                    break;
                    
                case 'close-image-zoom':
                    if (typeof closeImageZoom === 'function') {
                        closeImageZoom(e);
                    }
                    break;
                    
                case 'prevent-close':
                    e.stopPropagation();
                    break;
                    
                case 'scroll-to-form':
                    if (typeof scrollToForm === 'function') {
                        scrollToForm();
                    }
                    break;
                    
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
                    
                case 'zoom-image':
                    if (target.dataset.imageSrc && typeof openImageZoom === 'function') {
                        openImageZoom(target.dataset.imageSrc);
                    }
                    break;
                    
                case 'delete-item-from-popup':
                    e.stopPropagation();
                    this.handleDeleteItemFromPopup(parseInt(target.dataset.itemId), target.dataset.itemTitle);
                    break;
                    
                case 'open-item-modal-from-popup':
                    this.handleOpenItemModal(parseInt(target.dataset.itemId));
                    break;
            }
        });
    }

    /**
     * Setup change event handlers
     */
    setupChangeHandlers() {
        // Import file handler
        const importInput = document.getElementById('importFile');
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    await this.handleImportData(file);
                    // Clear the input so the same file can be imported again
                    e.target.value = '';
                }
            });
        }
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

    /**
     * Handle delete current modal item
     */
    handleDeleteCurrentModalItem() {
        const currentItemId = this.modalManager.currentItemId;
        
        if (!currentItemId) {
            if (typeof showToast === 'function') {
                showToast('No item to delete', 'error');
            }
            return;
        }
        
        const confirmMessage = 'Delete this content?';
        
        if (confirm(confirmMessage)) {
            this.modalManager.closeContentModal();
            const result = this.listManager.deleteItem(currentItemId);
            
            if (result.success) {
                this.uiManager.updateStorageInfo();
                
                if (typeof showToast === 'function') {
                    showToast('Item deleted', 'default');
                }
            }
        }
    }

    /**
     * Handle delete author from popup
     */
    handleDeleteAuthorFromPopup() {
        const currentAuthor = this.modalManager.currentAuthor;
        
        if (!currentAuthor) {
            if (typeof showToast === 'function') {
                showToast('No author selected', 'error');
            }
            return;
        }
        
        const confirmMessage = `Delete all items by "${currentAuthor}"?`;
        
        if (confirm(confirmMessage)) {
            this.modalManager.closeAuthorPopup();
            const result = this.listManager.deleteAuthor(currentAuthor);
            
            if (result.success) {
                this.uiManager.updateStorageInfo();
                
                if (typeof showToast === 'function') {
                    showToast(`Deleted ${result.count} items`, 'default');
                }
            }
        }
    }

    /**
     * Handle delete item from popup
     * @param {number} itemId - Item ID
     * @param {string} itemTitle - Item title for confirmation
     */
    handleDeleteItemFromPopup(itemId, itemTitle) {
        const confirmMessage = `Are you sure you want to delete "${itemTitle}"?`;
        
        if (confirm(confirmMessage)) {
            const result = this.listManager.deleteItem(itemId);
            
            if (result.success) {
                // Check if any items remain for current author
                const currentAuthor = this.modalManager.currentAuthor;
                if (currentAuthor) {
                    const state = this.listManager.stateManager.getState();
                    const remainingItems = state.items.filter(i => i.author === currentAuthor);
                    
                    if (remainingItems.length === 0) {
                        this.modalManager.closeAuthorPopup();
                    } else {
                        this.modalManager.openAuthorPopup(currentAuthor);
                    }
                }
                
                this.uiManager.updateStorageInfo();
                
                if (typeof showToast === 'function') {
                    showToast('Item deleted', 'default');
                }
            }
        }
    }
}

export default EventHandlers;

