/**
 * GrowthVault - Modal Manager
 * Handles modal and popup dialogs
 */

import { CONFIG } from './config.js';
import { Validators } from './validators.js';

export class ModalManager {
    constructor(stateManager, listManager) {
        this.stateManager = stateManager;
        this.listManager = listManager;
        
        this.currentItemId = null; // ID of item currently in content modal
        this.currentAuthor = null; // Author currently in author popup
        this.pendingItemData = null; // Item data waiting to be saved to folder
        this.expandedFolders = new Set(); // Track which folders are expanded
        
        // Get modal elements
        this.contentModal = document.querySelector(CONFIG.SELECTORS.CONTENT_MODAL);
        this.authorPopup = document.querySelector(CONFIG.SELECTORS.AUTHOR_POPUP);
        this.folderSelectModal = document.getElementById('folderSelectModal');
        this.createFolderModal = document.getElementById('createFolderModal');
        
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

        this.currentItemId = itemId;
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
            modalText.innerHTML = Validators.sanitizeRichText(item.text || '');
            modalText.contentEditable = true;
            
            // Save on blur
            modalText.onblur = async () => {
                const newHtml = Validators.sanitizeRichText(modalText.innerHTML || '');
                if (item.text !== newHtml) {
                    await this.updateItemText(itemId, newHtml);
                }
            };
            modalText.onpaste = (event) => {
                event.preventDefault();
                const clipboard = event.clipboardData || window.clipboardData;
                const htmlData = clipboard?.getData('text/html');
                const textData = clipboard?.getData('text/plain') || '';
                const source = htmlData && htmlData.trim().length > 0 ? htmlData : textData;
                const sanitized = Validators.sanitizeRichText(source);
                const normalized = Validators.normalizeSpacing(sanitized);
                document.execCommand('insertHTML', false, normalized);
            };
        }

        // Set image
        if (modalImage) {
        if (item.image) {
            modalImage.src = item.image;
            modalImage.style.display = 'block';
            modalImage.style.cursor = 'pointer';
            modalImage.dataset.action = 'zoom-image';
            modalImage.dataset.imageSrc = item.image;
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
        if (formatToolbar) {
            formatToolbar.style.display = 'flex';
        }

        console.log('📄 Opened content modal for item:', itemId);
    }

    /**
     * Close content modal
     */
    async closeContentModal() {
        // Save any text changes before closing
        if (this.currentItemInModal) {
            const modalText = document.getElementById('modalText');
            if (modalText && modalText.isContentEditable) {
                const newHtml = Validators.sanitizeRichText(modalText.innerHTML || '');
                await this.updateItemText(this.currentItemInModal, newHtml);
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

        this.currentItemId = null;
        console.log('📄 Closed content modal');
    }

    /**
     * Open author popup showing all items by author (with folder support)
     * @param {string} author - Author name
     */
    openAuthorPopup(author) {
        // Delegate to folder-aware version
        return this.openAuthorPopupWithFolders(author);
    }

    /**
     * Legacy open author popup (kept for reference, replaced by openAuthorPopupWithFolders)
     * @param {string} author - Author name
     */
    openAuthorPopupLegacy(author) {
        const state = this.stateManager.getState();
        const items = state.items.filter(item => item.author === author);
        
        if (items.length === 0) {
            console.warn('No items found for author:', author);
            return;
        }

        this.currentAuthor = author;

        const popup = document.getElementById('authorPopup');
        const title = document.getElementById('authorPopupTitle');
        const itemsContainer = document.getElementById('authorPopupItems');

        // Set title
        if (title) {
            title.textContent = `${author} (${items.length} entries)`;
            title.dataset.author = author;
        }

        // Clear existing items
        if (itemsContainer) {
            itemsContainer.innerHTML = '';

            // Create each item using DOM manipulation (matches original)
            items.forEach(item => {
                this.renderAuthorPopupItem(item, itemsContainer, author);
            });

            // Setup drag & drop for reordering items
            this.addPopupDragAndDrop(author);
        }

        // Show popup
        if (popup) {
            popup.style.display = 'flex';
        }

        console.log('👤 Opened author popup for:', author, `(${items.length} items)`);
    }

    /**
     * Render an item in the author popup using DOM manipulation
     * @param {Object} item - Item object
     * @param {HTMLElement} container - Container element
     * @param {string} author - Author name
     */
    renderAuthorPopupItem(item, container, author, folderId = null) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'popup-list-item';
        itemDiv.draggable = true;
        itemDiv.dataset.id = item.id;
        itemDiv.dataset.author = author;
        if (folderId) {
            itemDiv.dataset.folderId = folderId;
        }

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'popup-drag-handle';

        // Date
        const dateDiv = document.createElement('div');
        dateDiv.className = 'item-date';
        dateDiv.textContent = item.date;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.dataset.action = 'delete-item-from-popup';
        deleteBtn.dataset.itemId = item.id;
        deleteBtn.dataset.itemTitle = item.title || 'Untitled';

        // Title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'item-title';
        titleDiv.textContent = item.title || 'Untitled';
        titleDiv.dataset.action = 'make-editable';
        titleDiv.dataset.itemId = item.id;

        // Append base elements
        itemDiv.appendChild(dragHandle);
        itemDiv.appendChild(dateDiv);
        itemDiv.appendChild(deleteBtn);
        itemDiv.appendChild(titleDiv);

        // Text (if exists)
        if (item.text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'item-text';
            textDiv.innerHTML = Validators.sanitizeRichText(item.text);
            textDiv.style.cursor = 'pointer';
            textDiv.dataset.action = 'open-item-modal-from-popup';
            textDiv.dataset.itemId = item.id;
            itemDiv.appendChild(textDiv);
        }

        // Image (if exists)
        if (item.image) {
            console.log('🖼️  Rendering image for item:', item.id, 'size:', item.image.length);
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = 'User uploaded image';
            img.className = 'item-image';
            img.style.cursor = 'pointer';
            img.dataset.action = 'zoom-image';
            img.dataset.imageSrc = img.src;
            itemDiv.appendChild(img);
        } else {
            console.log('ℹ️  No image for item:', item.id);
        }

        container.appendChild(itemDiv);
    }

    /**
     * Close author popup
     */
    closeAuthorPopup() {
        this.currentAuthor = null;
        
        if (this.authorPopup) {
            this.authorPopup.style.display = 'none';
        }

        console.log('👤 Closed author popup');
    }

    /**
     * Add drag & drop functionality for items within author popup
     * @param {string} author - Author name
     */
    addPopupDragAndDrop(author) {
        const itemsContainer = document.getElementById('authorPopupItems');
        if (!itemsContainer) return;

        const items = itemsContainer.querySelectorAll('.popup-list-item');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.id);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                items.forEach(i => i.classList.remove('drag-over'));
                draggedItem = null;
            });

            item.addEventListener('dragover', (e) => {
                if (draggedItem && draggedItem !== item) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                if (!item.contains(e.relatedTarget)) {
                    item.classList.remove('drag-over');
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                if (draggedItem && draggedItem !== item) {
                    const draggedIndex = Array.from(itemsContainer.children).indexOf(draggedItem);
                    const targetIndex = Array.from(itemsContainer.children).indexOf(item);

                    if (draggedIndex < targetIndex) {
                        item.parentNode.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        item.parentNode.insertBefore(draggedItem, item);
                    }

                    this.updateAuthorItemsFromDOM(author);
                }
            });

            // Prevent drag from interfering with click events
            let isDragging = false;
            item.addEventListener('mousedown', () => isDragging = false);
            item.addEventListener('mousemove', () => isDragging = true);

            const clickableElements = item.querySelectorAll('.item-text, .delete-btn, .item-title, .item-image');
            clickableElements.forEach(el => {
                el.addEventListener('click', (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            });
        });
    }

    /**
     * Update item order in state based on DOM order
     * @param {string} author - Author name
     */
    async updateAuthorItemsFromDOM(author) {
        const itemsContainer = document.getElementById('authorPopupItems');
        if (!itemsContainer) return;

        const domOrder = Array.from(itemsContainer.querySelectorAll('.popup-list-item'))
            .map(item => parseInt(item.dataset.id));

        const state = this.stateManager.getState();
        const allItems = [...state.items];

        // Separate items by this author and others
        const authorItems = allItems.filter(item => item.author === author);
        const otherItems = allItems.filter(item => item.author !== author);

        // Reorder author's items based on DOM
        const reorderedAuthorItems = domOrder.map(id => 
            authorItems.find(item => item.id === id)
        ).filter(Boolean);

        // Merge back: find position of first author item in original array
        const firstAuthorIndex = allItems.findIndex(item => item.author === author);
        
        // Reconstruct items array
        const newItems = [
            ...allItems.slice(0, firstAuthorIndex),
            ...reorderedAuthorItems,
            ...allItems.slice(firstAuthorIndex + authorItems.length)
        ];

        this.stateManager.setState({ items: newItems });
        await this.listManager.save();

        console.log('🔄 Reordered items for author:', author);
    }

    /**
     * Delete current item in modal
     */
    async deleteCurrentModalItem() {
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
            await this.listManager.deleteItem(this.currentItemId);
            this.closeContentModal();

            // If in author popup, refresh or close if no items left
            if (this.currentAuthor) {
                const remainingItems = state.items.filter(i => i.author === this.currentAuthor);
                if (remainingItems.length > 0) {
                    this.openAuthorPopup(this.currentAuthor);
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
    async deleteAuthorFromPopup() {
        if (!this.currentAuthor) {
            console.warn('No author in popup to delete');
            return;
        }

        const state = this.stateManager.getState();
        const items = state.items.filter(i => i.author === this.currentAuthor);
        
        const confirmMessage = `Delete all ${items.length} items by "${this.currentAuthor}"?`;
        
        if (confirm(confirmMessage)) {
            const result = await this.listManager.deleteAuthor(this.currentAuthor);
            
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
    async updateItemText(itemId, newText) {
        const state = this.stateManager.getState();
        const item = state.items.find(i => i.id === itemId);
        
        const sanitized = Validators.sanitizeRichText(newText || '');
        if (item && item.text !== sanitized) {
            const updatedItems = state.items.map(i => 
                i.id === itemId ? { ...i, text: sanitized } : i
            );
            
            this.stateManager.setState({ items: updatedItems });
            await this.listManager.save();
            
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
        return Validators.sanitizeRichText(text);
    }

    // ==================== FOLDER MODAL METHODS ====================

    /**
     * Open folder select modal with pending item data
     * @param {Object} itemData - Item data to save after folder selection
     */
    openFolderSelectModal(itemData) {
        this.pendingItemData = itemData;
        
        const authorSelect = document.getElementById('folderAuthorSelect');
        const folderList = document.getElementById('folderSelectList');
        
        if (!authorSelect || !folderList) return;

        // Populate author dropdown
        const orderedAuthors = this.listManager.getOrderedAuthors();
        const inputAuthor = itemData.author?.trim();
        
        // Build options: input author first if new, then existing authors
        let options = '';
        if (inputAuthor && !orderedAuthors.includes(inputAuthor)) {
            options += `<option value="${this.escapeHtml(inputAuthor)}">${this.escapeHtml(inputAuthor)} (new)</option>`;
        }
        orderedAuthors.forEach(author => {
            const selected = author === inputAuthor ? 'selected' : '';
            options += `<option value="${this.escapeHtml(author)}" ${selected}>${this.escapeHtml(author)}</option>`;
        });
        
        if (!inputAuthor && orderedAuthors.length === 0) {
            options = '<option value="">No authors yet</option>';
        }
        
        authorSelect.innerHTML = options;

        // Update folder list for selected author
        this.updateFolderList(authorSelect.value);

        // Listen for author change
        authorSelect.onchange = () => {
            this.updateFolderList(authorSelect.value);
        };

        // Show modal
        if (this.folderSelectModal) {
            this.folderSelectModal.style.display = 'flex';
        }

        console.log('📁 Opened folder select modal');
    }

    /**
     * Update folder list for selected author
     * @param {string} author - Author name
     */
    updateFolderList(author) {
        const folderList = document.getElementById('folderSelectList');
        if (!folderList || !author) {
            if (folderList) {
                folderList.innerHTML = '<div class="folder-list-empty">Select an author first</div>';
            }
            return;
        }

        const folders = this.listManager.getFoldersForAuthor(author);

        if (folders.length === 0) {
            folderList.innerHTML = '<div class="folder-list-empty">No folders yet. Create one below!</div>';
            return;
        }

        folderList.innerHTML = folders.map(folder => {
            const itemCount = folder.itemIds.length;
            return `
                <div class="folder-list-item" data-action="select-folder" data-folder-id="${folder.id}">
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">${this.escapeHtml(folder.name)}</span>
                    <span class="folder-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Close folder select modal
     */
    closeFolderSelectModal() {
        this.pendingItemData = null;
        
        if (this.folderSelectModal) {
            this.folderSelectModal.style.display = 'none';
        }

        console.log('📁 Closed folder select modal');
    }

    /**
     * Handle folder selection - save item to folder
     * @param {number} folderId - Selected folder ID
     */
    async selectFolder(folderId) {
        if (!this.pendingItemData) {
            console.warn('No pending item data');
            return { success: false, error: 'No item data' };
        }

        const authorSelect = document.getElementById('folderAuthorSelect');
        const selectedAuthor = authorSelect?.value;
        
        if (!selectedAuthor) {
            return { success: false, error: 'No author selected' };
        }

        // Update item data with selected author
        const itemData = {
            ...this.pendingItemData,
            author: selectedAuthor
        };

        // Add the item
        const result = await this.listManager.addItem(itemData);
        
        if (!result.success) {
            return result;
        }

        // Add item to folder
        const folderResult = await this.listManager.addItemToFolder(result.item.id, folderId);
        
        if (!folderResult.success) {
            console.error('Failed to add item to folder:', folderResult.error);
        }

        this.closeFolderSelectModal();
        
        return { success: true, item: result.item, folder: folderId };
    }

    /**
     * Open create folder modal
     * @param {string} author - Author for new folder (optional)
     */
    openCreateFolderModal(author = null) {
        const input = document.getElementById('newFolderName');
        if (input) {
            input.value = '';
            input.focus();
        }

        // Store author context if provided
        this.createFolderForAuthor = author;

        if (this.createFolderModal) {
            this.createFolderModal.style.display = 'flex';
        }

        console.log('📁 Opened create folder modal');
    }

    /**
     * Close create folder modal
     */
    closeCreateFolderModal() {
        this.createFolderForAuthor = null;
        
        if (this.createFolderModal) {
            this.createFolderModal.style.display = 'none';
        }

        console.log('📁 Closed create folder modal');
    }

    /**
     * Confirm folder creation
     */
    async confirmCreateFolder() {
        const input = document.getElementById('newFolderName');
        const folderName = input?.value?.trim();
        
        if (!folderName) {
            if (typeof showToast === 'function') {
                showToast('Please enter a folder name', 'error');
            }
            return { success: false, error: 'Folder name required' };
        }

        // Determine author
        let author = this.createFolderForAuthor;
        if (!author) {
            const authorSelect = document.getElementById('folderAuthorSelect');
            author = authorSelect?.value;
        }
        if (!author && this.pendingItemData) {
            author = this.pendingItemData.author;
        }
        if (!author && this.currentAuthor) {
            author = this.currentAuthor;
        }

        if (!author) {
            if (typeof showToast === 'function') {
                showToast('No author specified', 'error');
            }
            return { success: false, error: 'No author' };
        }

        const result = await this.listManager.createFolder(author, folderName);

        if (result.success) {
            this.closeCreateFolderModal();
            
            // Refresh folder list if in folder select modal
            if (this.folderSelectModal?.style.display === 'flex') {
                this.updateFolderList(author);
            }
            
            // Refresh author popup if open
            if (this.currentAuthor === author) {
                this.openAuthorPopup(author);
            }

            if (typeof showToast === 'function') {
                showToast(`Folder "${folderName}" created`, 'success');
            }
        } else {
            if (typeof showToast === 'function') {
                showToast(result.error || 'Failed to create folder', 'error');
            }
        }

        return result;
    }

    // ==================== UPDATED AUTHOR POPUP WITH FOLDERS ====================

    /**
     * Open author popup showing folders and items
     * @param {string} author - Author name
     */
    openAuthorPopupWithFolders(author) {
        const state = this.stateManager.getState();
        const allItems = state.items.filter(item => item.author === author);
        
        if (allItems.length === 0) {
            console.warn('No items found for author:', author);
            return;
        }

        this.currentAuthor = author;

        const popup = document.getElementById('authorPopup');
        const title = document.getElementById('authorPopupTitle');
        const itemsContainer = document.getElementById('authorPopupItems');

        // Set title
        if (title) {
            title.textContent = `${author} (${allItems.length} entries)`;
            title.dataset.author = author;
        }

        // Get folders and unfiled items
        const folders = this.listManager.getFoldersForAuthor(author);
        const unfiledItems = this.listManager.getUnfiledItems(author);

        // Build content
        if (itemsContainer) {
            itemsContainer.innerHTML = '';

            // Create folder button
            const createBtn = document.createElement('button');
            createBtn.className = 'create-folder-btn';
            createBtn.dataset.action = 'create-folder-in-popup';
            createBtn.innerHTML = '<span class="plus-icon">+</span> Create New Folder';
            itemsContainer.appendChild(createBtn);

            // Render folders
            folders.forEach(folder => {
                this.renderFolderSection(folder, itemsContainer, author);
            });

            // Render unfiled section
            if (unfiledItems.length > 0 || folders.length > 0) {
                this.renderUnfiledSection(unfiledItems, itemsContainer, author);
            }
        }

        // Show popup
        if (popup) {
            popup.style.display = 'flex';
        }

        // Setup drag and drop
        this.setupFolderDragAndDrop(author);

        console.log('👤 Opened author popup for:', author, `(${folders.length} folders, ${unfiledItems.length} unfiled)`);
    }

    /**
     * Render a folder section in author popup
     * @param {Object} folder - Folder object
     * @param {HTMLElement} container - Container element
     * @param {string} author - Author name
     */
    renderFolderSection(folder, container, author) {
        const items = this.listManager.getItemsInFolder(folder.id);
        const isExpanded = this.expandedFolders.has(folder.id);

        const section = document.createElement('div');
        section.className = 'folder-section';
        section.dataset.folderId = folder.id;
        section.draggable = true;

        // Folder header
        const header = document.createElement('div');
        header.className = `folder-header ${isExpanded ? '' : 'collapsed'}`;
        header.dataset.action = 'toggle-folder';
        header.dataset.folderId = folder.id;
        header.innerHTML = `
            <span class="folder-icon">📂</span>
            <span class="folder-name">${this.escapeHtml(folder.name)}</span>
            <span class="folder-count">${items.length}</span>
            <div class="folder-header-actions">
                <button class="folder-action-btn" data-action="rename-folder" data-folder-id="${folder.id}" title="Rename">✏️</button>
                <button class="folder-action-btn delete" data-action="delete-folder" data-folder-id="${folder.id}" title="Delete">🗑️</button>
            </div>
        `;

        // Folder contents
        const contents = document.createElement('div');
        contents.className = `folder-contents ${isExpanded ? 'expanded' : ''}`;
        contents.dataset.folderId = folder.id;

        if (items.length === 0) {
            contents.innerHTML = '<div class="folder-contents-empty">Drag items here or this folder is empty</div>';
        } else {
            items.forEach(item => {
                this.renderAuthorPopupItem(item, contents, author, folder.id);
            });
        }

        section.appendChild(header);
        section.appendChild(contents);
        container.appendChild(section);
    }

    /**
     * Render unfiled items section
     * @param {Array} items - Unfiled items
     * @param {HTMLElement} container - Container element
     * @param {string} author - Author name
     */
    renderUnfiledSection(items, container, author) {
        const section = document.createElement('div');
        section.className = 'unfiled-section';
        section.dataset.folderId = 'unfiled';

        const header = document.createElement('div');
        header.className = 'unfiled-header';
        header.innerHTML = `
            <span class="unfiled-icon">📄</span>
            <span class="unfiled-title">Unfiled Items</span>
            <span class="unfiled-count">${items.length}</span>
        `;
        section.appendChild(header);

        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'unfiled-items';
        
        if (items.length === 0) {
            itemsDiv.innerHTML = '<div class="folder-contents-empty">All items are organized in folders</div>';
        } else {
            items.forEach(item => {
                this.renderAuthorPopupItem(item, itemsDiv, author, null);
            });
        }

        section.appendChild(itemsDiv);
        container.appendChild(section);
    }

    /**
     * Toggle folder expand/collapse
     * @param {number} folderId - Folder ID
     */
    toggleFolder(folderId) {
        const header = document.querySelector(`.folder-header[data-folder-id="${folderId}"]`);
        const contents = document.querySelector(`.folder-contents[data-folder-id="${folderId}"]`);

        if (header && contents) {
            const isExpanded = contents.classList.contains('expanded');
            
            if (isExpanded) {
                header.classList.add('collapsed');
                contents.classList.remove('expanded');
                this.expandedFolders.delete(folderId);
            } else {
                header.classList.remove('collapsed');
                contents.classList.add('expanded');
                this.expandedFolders.add(folderId);
            }
        }
    }

    /**
     * Setup drag and drop for folders and items
     * @param {string} author - Author name
     */
    setupFolderDragAndDrop(author) {
        const itemsContainer = document.getElementById('authorPopupItems');
        if (!itemsContainer) return;

        // Item drag and drop to folders
        const items = itemsContainer.querySelectorAll('.popup-list-item');
        const folderHeaders = itemsContainer.querySelectorAll('.folder-header');
        const unfiledSection = itemsContainer.querySelector('.unfiled-section');

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.id);
                e.dataTransfer.setData('application/x-item-id', item.dataset.id);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                folderHeaders.forEach(h => h.classList.remove('drop-target'));
                if (unfiledSection) unfiledSection.classList.remove('drop-target');
            });
        });

        // Folder drop targets
        folderHeaders.forEach(header => {
            header.addEventListener('dragover', (e) => {
                if (e.dataTransfer.types.includes('application/x-item-id')) {
                    e.preventDefault();
                    header.classList.add('drop-target');
                }
            });

            header.addEventListener('dragleave', () => {
                header.classList.remove('drop-target');
            });

            header.addEventListener('drop', async (e) => {
                e.preventDefault();
                header.classList.remove('drop-target');
                
                const itemId = parseInt(e.dataTransfer.getData('application/x-item-id'));
                const folderId = parseInt(header.dataset.folderId);
                
                if (itemId && folderId) {
                    await this.listManager.addItemToFolder(itemId, folderId);
                    this.openAuthorPopup(author); // Refresh
                }
            });
        });

        // Unfiled section drop target
        if (unfiledSection) {
            unfiledSection.addEventListener('dragover', (e) => {
                if (e.dataTransfer.types.includes('application/x-item-id')) {
                    e.preventDefault();
                    unfiledSection.classList.add('drop-target');
                }
            });

            unfiledSection.addEventListener('dragleave', () => {
                unfiledSection.classList.remove('drop-target');
            });

            unfiledSection.addEventListener('drop', async (e) => {
                e.preventDefault();
                unfiledSection.classList.remove('drop-target');
                
                const itemId = parseInt(e.dataTransfer.getData('application/x-item-id'));
                
                if (itemId) {
                    await this.listManager.removeItemFromFolder(itemId);
                    this.openAuthorPopup(author); // Refresh
                }
            });
        }

        // Existing item reorder drag and drop within same container
        this.addPopupDragAndDrop(author);
    }

    /**
     * Delete a folder from popup
     * @param {number} folderId - Folder ID
     */
    async deleteFolderFromPopup(folderId) {
        const state = this.stateManager.getState();
        const folder = state.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        const itemCount = folder.itemIds.length;
        const message = itemCount > 0 
            ? `Delete folder "${folder.name}"? ${itemCount} item(s) will be moved to Unfiled.`
            : `Delete empty folder "${folder.name}"?`;

        if (confirm(message)) {
            const result = await this.listManager.deleteFolder(folderId);
            
            if (result.success) {
                if (typeof showToast === 'function') {
                    showToast('Folder deleted', 'default');
                }
                this.openAuthorPopup(this.currentAuthor); // Refresh
            }
        }
    }

    /**
     * Rename a folder
     * @param {number} folderId - Folder ID
     */
    async renameFolderFromPopup(folderId) {
        const state = this.stateManager.getState();
        const folder = state.folders.find(f => f.id === folderId);
        
        if (!folder) return;

        const newName = prompt('Enter new folder name:', folder.name);
        
        if (newName && newName.trim() !== folder.name) {
            const result = await this.listManager.renameFolder(folderId, newName.trim());
            
            if (result.success) {
                if (typeof showToast === 'function') {
                    showToast('Folder renamed', 'success');
                }
                this.openAuthorPopup(this.currentAuthor); // Refresh
            } else {
                if (typeof showToast === 'function') {
                    showToast(result.error || 'Failed to rename', 'error');
                }
            }
        }
    }
}

export default ModalManager;

