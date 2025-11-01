/**
 * GrowthVault - Modal Manager
 * Handles modal and popup dialogs
 */

import { CONFIG } from './config.js';

export class ModalManager {
    constructor(stateManager, listManager) {
        this.stateManager = stateManager;
        this.listManager = listManager;
        
        this.currentItemInModal = null;
        this.currentAuthorInPopup = null;
        
        // Get modal elements
        this.contentModal = document.querySelector(CONFIG.SELECTORS.CONTENT_MODAL);
        this.authorPopup = document.querySelector(CONFIG.SELECTORS.AUTHOR_POPUP);
        
        console.log('🖼️  ModalManager initialized');
    }

    /**
     * Open content modal for an item
     * @param {number} itemId - Item ID
     */
    openContentModal(itemId) {
        const state = this.stateManager.getState();
        const item = state.items.find(i => i.id === itemId);
        
        if (!item) {
            console.warn('Item not found:', itemId);
            return;
        }

        this.currentItemInModal = itemId;

        // Populate modal
        const modalText = document.getElementById('modalText');
        const modalImage = document.getElementById('modalImage');
        const modalAuthor = document.getElementById('modalAuthor');
        const modalDate = document.getElementById('modalDate');
        const modalTitle = document.querySelector('.modal-title');

        if (modalAuthor) modalAuthor.textContent = item.author;
        if (modalDate) modalDate.textContent = item.date;
        if (modalTitle) modalTitle.textContent = item.title || 'Untitled';

        // Set text content
        if (modalText) {
            modalText.innerHTML = this.preserveText(item.text || '');
            modalText.contentEditable = true;
            
            // Save on blur
            modalText.onblur = () => {
                const newText = modalText.innerText;
                if (item.text !== newText) {
                    this.updateItemText(itemId, newText);
                }
            };
        }

        // Set image
        if (modalImage) {
            if (item.image) {
                modalImage.src = item.image;
                modalImage.style.display = 'block';
                modalImage.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof openImageZoom === 'function') {
                        openImageZoom(item.image);
                    }
                };
            } else {
                modalImage.style.display = 'none';
            }
        }

        // Show modal
        if (this.contentModal) {
            this.contentModal.style.display = 'flex';
        }

        // Show format toolbar if text exists
        const formatToolbar = document.getElementById('formatToolbar');
        if (formatToolbar && item.text) {
            formatToolbar.style.display = 'flex';
        }

        console.log('📄 Opened content modal for item:', itemId);
    }

    /**
     * Close content modal
     */
    closeContentModal() {
        // Save any text changes before closing
        if (this.currentItemInModal) {
            const modalText = document.getElementById('modalText');
            if (modalText && modalText.isContentEditable) {
                const newText = modalText.innerText;
                this.updateItemText(this.currentItemInModal, newText);
            }
        }

        this.currentItemInModal = null;
        
        if (this.contentModal) {
            this.contentModal.style.display = 'none';
        }

        // Hide format toolbar
        const formatToolbar = document.getElementById('formatToolbar');
        if (formatToolbar) {
            formatToolbar.style.display = 'none';
        }

        console.log('📄 Closed content modal');
    }

    /**
     * Open author popup showing all items by author
     * @param {string} author - Author name
     */
    openAuthorPopup(author) {
        const state = this.stateManager.getState();
        const items = state.items.filter(item => item.author === author);
        
        if (items.length === 0) {
            console.warn('No items found for author:', author);
            return;
        }

        this.currentAuthorInPopup = author;

        const popup = document.getElementById('authorPopup');
        const title = document.getElementById('authorPopupTitle');
        const itemsContainer = document.getElementById('authorPopupItems');

        // Set title
        if (title) {
            title.textContent = `${author} (${items.length} entries)`;
            title.dataset.author = author;
        }

        // Render items
        if (itemsContainer) {
            itemsContainer.innerHTML = items.map(item => this.renderAuthorPopupItem(item)).join('');
        }

        // Show popup
        if (popup) {
            popup.style.display = 'flex';
        }

        console.log('👤 Opened author popup for:', author, `(${items.length} items)`);
    }

    /**
     * Render an item in the author popup
     * @param {Object} item - Item object
     * @returns {string} HTML string
     */
    renderAuthorPopupItem(item) {
        const textPreview = item.text ? this.truncateText(item.text, 150) : '';
        
        return `
            <div class="popup-list-item" data-item-id="${item.id}">
                <div class="popup-item-header">
                    <h4 class="popup-item-title" data-action="open-item-modal" data-item-id="${item.id}">
                        ${this.escapeHtml(item.title || 'Untitled')}
                    </h4>
                    <button class="popup-item-delete" data-action="delete-item" data-item-id="${item.id}">×</button>
                </div>
                ${item.image ? `<img class="popup-item-image" src="${item.image}" alt="Item image" data-action="open-item-modal" data-item-id="${item.id}">` : ''}
                ${textPreview ? `<p class="popup-item-text" data-action="open-item-modal" data-item-id="${item.id}">${this.escapeHtml(textPreview)}</p>` : ''}
                <div class="popup-item-date">${this.escapeHtml(item.date)}</div>
            </div>
        `;
    }

    /**
     * Close author popup
     */
    closeAuthorPopup() {
        this.currentAuthorInPopup = null;
        
        if (this.authorPopup) {
            this.authorPopup.style.display = 'none';
        }

        console.log('👤 Closed author popup');
    }

    /**
     * Delete current item in modal
     */
    deleteCurrentModalItem() {
        if (!this.currentItemInModal) {
            console.warn('No item in modal to delete');
            return;
        }

        const state = this.stateManager.getState();
        const item = state.items.find(i => i.id === this.currentItemInModal);
        
        if (!item) {
            console.warn('Item not found');
            return;
        }

        const confirmMessage = `Are you sure you want to delete "${item.title || 'Untitled'}"?`;
        
        if (confirm(confirmMessage)) {
            this.listManager.deleteItem(this.currentItemInModal);
            this.closeContentModal();

            // If in author popup, refresh or close if no items left
            if (this.currentAuthorInPopup) {
                const remainingItems = state.items.filter(i => i.author === this.currentAuthorInPopup);
                if (remainingItems.length > 0) {
                    this.openAuthorPopup(this.currentAuthorInPopup);
                } else {
                    this.closeAuthorPopup();
                }
            }

            if (typeof showToast === 'function') {
                showToast('Item deleted', 'default');
            }
        }
    }

    /**
     * Delete all items by author (from popup)
     */
    deleteAuthorFromPopup() {
        if (!this.currentAuthorInPopup) {
            console.warn('No author in popup to delete');
            return;
        }

        const state = this.stateManager.getState();
        const items = state.items.filter(i => i.author === this.currentAuthorInPopup);
        
        const confirmMessage = `Delete all ${items.length} items by "${this.currentAuthorInPopup}"?`;
        
        if (confirm(confirmMessage)) {
            const result = this.listManager.deleteAuthor(this.currentAuthorInPopup);
            
            if (result.success) {
                this.closeAuthorPopup();
                
                if (typeof showToast === 'function') {
                    showToast(`Deleted ${result.count} items`, 'default');
                }
            }
        }
    }

    /**
     * Update item text
     * @param {number} itemId - Item ID
     * @param {string} newText - New text content
     */
    updateItemText(itemId, newText) {
        const state = this.stateManager.getState();
        const item = state.items.find(i => i.id === itemId);
        
        if (item && item.text !== newText) {
            const updatedItems = state.items.map(i => 
                i.id === itemId ? { ...i, text: newText } : i
            );
            
            this.stateManager.setState({ items: updatedItems });
            this.listManager.save();
            
            console.log('✏️  Updated item text:', itemId);
        }
    }

    /**
     * Escape HTML
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Preserve text formatting
     * @param {string} text
     * @returns {string}
     */
    preserveText(text) {
        return text
            .split('\n')
            .map(line => this.escapeHtml(line))
            .join('<br>');
    }

    /**
     * Truncate text for preview
     * @param {string} text
     * @param {number} maxLength
     * @returns {string}
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

export default ModalManager;

