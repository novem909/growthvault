/**
 * GrowthVault - UI Manager
 * Handles DOM rendering and updates
 */

import { CONFIG } from './config.js';
import { Validators } from './validators.js';
import { TouchDragHandler } from './touch-drag.js';

export class UIManager {
    constructor(stateManager, listManager) {
        this.stateManager = stateManager;
        this.listManager = listManager;
        
        // Get DOM elements
        this.visualList = document.querySelector(CONFIG.SELECTORS.VISUAL_LIST);
        this.form = document.querySelector(CONFIG.SELECTORS.FORM);
        this.authorInput = document.querySelector(CONFIG.SELECTORS.AUTHOR_INPUT);
        this.titleInput = document.querySelector(CONFIG.SELECTORS.TITLE_INPUT);
        this.textInput = document.querySelector(CONFIG.SELECTORS.TEXT_INPUT);
        this.imageInput = document.querySelector(CONFIG.SELECTORS.IMAGE_INPUT);
        this.setupRichTextInput();
        
        // Touch drag handler for mobile
        this.touchDragHandler = null;
        
        // Subscribe to state changes
        this.stateManager.subscribe('items-changed', (newState, oldState) => {
            if (JSON.stringify(newState.items) !== JSON.stringify(oldState.items) ||
                JSON.stringify(newState.authorOrder) !== JSON.stringify(oldState.authorOrder)) {
                this.renderItems();
            }
        });

        this.stateManager.subscribe('titles-changed', (newState) => {
            this.updateTitles(newState.titles);
        });
        
        console.log('🎨 UIManager initialized');
    }

    /**
     * Render all items grouped by author
     */
    renderItems() {
        const state = this.stateManager.getState();
        
        if (state.items.length === 0) {
            this.renderEmptyState();
            return;
        }

        const grouped = this.listManager.groupItemsByAuthor();
        const orderedAuthors = this.listManager.getOrderedAuthors();

        this.visualList.innerHTML = orderedAuthors
            .map(author => this.renderAuthorBox(author, grouped.get(author)))
            .join('');

        // Add drag and drop after rendering
        this.addAuthorDragAndDrop();
        
        // Setup touch drag for mobile
        this.setupTouchDragForAuthors();
        
        console.log('🎨 Rendered', orderedAuthors.length, 'author boxes');
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.visualList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <p>No items yet. Add your first item above!</p>
            </div>
        `;
    }

    /**
     * Render an author box
     * @param {string} author - Author name
     * @param {Array} items - Author's items
     * @returns {string} HTML string
     */
    renderAuthorBox(author, items) {
        return `
            <div class="author-box" data-author="${this.escapeHtml(author)}" data-action="open-author-popup">
                <div class="author-drag-handle"></div>
                <button class="author-delete-btn" data-action="delete-author" data-author="${this.escapeHtml(author)}">×</button>
                <div class="author-count">${items.length}</div>
                <div class="author-title">${this.escapeHtml(author)}</div>
                <div class="author-subtitle">click to see author's content</div>
            </div>
        `;
    }

    /**
     * Add drag and drop functionality to author boxes
     */
    addAuthorDragAndDrop() {
        const authorBoxes = this.visualList.querySelectorAll('.author-box');
        let draggedAuthor = null;
        let dragStartTime = 0;

        authorBoxes.forEach(box => {
            const dragHandle = box.querySelector('.author-drag-handle');
            if (!dragHandle) return;

            // Only drag handle is draggable
            dragHandle.draggable = true;
            box.draggable = false;

            dragHandle.addEventListener('dragstart', (e) => {
                dragStartTime = Date.now();
                draggedAuthor = box;
                box.classList.add('dragging');

                // Set drag image to the whole box
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setDragImage(box, box.offsetWidth / 2, box.offsetHeight / 2);
                e.dataTransfer.setData('text/plain', box.dataset.author);

                // Block pointer events immediately
                requestAnimationFrame(() => {
                    if (draggedAuthor) {
                        draggedAuthor.style.pointerEvents = 'none';
                    }
                });
            });

            dragHandle.addEventListener('dragend', () => {
                if (draggedAuthor) {
                    draggedAuthor.classList.remove('dragging');
                    draggedAuthor.style.pointerEvents = '';
                }
                authorBoxes.forEach(b => b.classList.remove('drag-over'));
                draggedAuthor = null;
            });

            box.addEventListener('dragover', (e) => {
                if (draggedAuthor && draggedAuthor !== box) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    box.classList.add('drag-over');
                }
            });

            box.addEventListener('dragleave', (e) => {
                if (!box.contains(e.relatedTarget)) {
                    box.classList.remove('drag-over');
                }
            });

            box.addEventListener('drop', async (e) => {
                e.preventDefault();
                box.classList.remove('drag-over');

                if (draggedAuthor && draggedAuthor !== box) {
                    // Swap positions in DOM
                    const draggedIndex = Array.from(this.visualList.children).indexOf(draggedAuthor);
                    const targetIndex = Array.from(this.visualList.children).indexOf(box);

                    if (draggedIndex < targetIndex) {
                        box.parentNode.insertBefore(draggedAuthor, box.nextSibling);
                    } else {
                        box.parentNode.insertBefore(draggedAuthor, box);
                    }

                    await this.updateAuthorOrderFromDOM();
                }
            });

            // Prevent click after drag
            box.addEventListener('click', (e) => {
                const timeSinceDragStart = Date.now() - dragStartTime;
                if (timeSinceDragStart < 200) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });
    }

    /**
     * Setup touch drag and drop for author boxes (mobile)
     */
    setupTouchDragForAuthors() {
        // Only setup on touch devices
        if (!TouchDragHandler.isTouchDevice()) return;
        
        // Destroy previous handler if exists
        if (this.touchDragHandler) {
            this.touchDragHandler.destroy();
            this.touchDragHandler = null;
        }
        
        // Create new touch drag handler for author boxes
        this.touchDragHandler = new TouchDragHandler({
            container: CONFIG.SELECTORS.VISUAL_LIST,
            draggable: '.author-box',
            handle: '.author-drag-handle',
            dropTargets: '.author-box',
            holdDuration: 200,
            onDragStart: (item) => {
                console.log('📱 Touch drag started:', item.dataset.author);
            },
            onDrop: async (item, target, position) => {
                console.log('📱 Touch drop:', item.dataset.author, 'position:', position);
                // Update author order based on new DOM positions
                await this.updateAuthorOrderFromDOM();
            },
            onCancel: (item) => {
                console.log('📱 Touch drag cancelled:', item.dataset.author);
            }
        });
    }

    /**
     * Update author order based on current DOM order
     */
    async updateAuthorOrderFromDOM() {
        const authorBoxes = this.visualList.querySelectorAll('.author-box');
        const newOrder = Array.from(authorBoxes).map(box => box.dataset.author);
        await this.listManager.updateAuthorOrder(newOrder);
    }

    /**
     * Clear form inputs
     */
    clearForm() {
        if (this.authorInput) this.authorInput.value = '';
        if (this.titleInput) this.titleInput.value = '';
        if (this.textInput) {
            this.textInput.innerHTML = '';
        }
        if (this.imageInput) this.imageInput.value = '';
        const fileInputText = document.getElementById('fileInputText');
        if (fileInputText) fileInputText.textContent = 'No file chosen';
    }

    /**
     * Setup rich text input behavior for the content field
     */
    setupRichTextInput() {
        if (!this.textInput) return;

        const editor = this.textInput;

        const ensurePlaceholder = () => {
            const plain = Validators.extractTextFromHtml(editor.innerHTML || '').trim();
            if (!plain && editor.innerHTML && editor.innerHTML !== '') {
                editor.innerHTML = '';
            }
        };

        editor.addEventListener('paste', (event) => {
            event.preventDefault();
            const clipboard = event.clipboardData || window.clipboardData;
            const htmlData = clipboard?.getData('text/html');
            const textData = clipboard?.getData('text/plain') || '';
            const source = htmlData && htmlData.trim().length > 0
                ? htmlData
                : this.convertPlainTextToHtml(textData);
            const sanitized = Validators.sanitizeRichText(source);
            const normalized = Validators.normalizeSpacing(sanitized);
            editor.innerHTML = normalized || '';
            this.placeCaretAtEnd(editor);
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        });

        editor.addEventListener('input', () => {
            if (editor.innerHTML === '<br>') {
                editor.innerHTML = '';
            }
            ensurePlaceholder();
        });

        editor.addEventListener('blur', () => {
            const sanitized = Validators.sanitizeRichText(editor.innerHTML || '');
            editor.innerHTML = sanitized;
            ensurePlaceholder();
        });
    }

    /**
     * Convert plain text (with newlines) to minimal HTML preserving breaks
     * @param {string} text
     * @returns {string}
     */
    convertPlainTextToHtml(text) {
        if (!text) return '';
        return text
            .split(/\r?\n/)
            .map(line => this.escapeHtml(line))
            .join('<br>');
    }

    /**
     * Position the caret at the end of a contenteditable element
     * @param {HTMLElement} element
     */
    placeCaretAtEnd(element) {
        if (!element) return;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Update titles in DOM
     * @param {Object} titles - {mainTitle, subtitle, listTitle}
     */
    updateTitles(titles) {
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        const listTitle = document.getElementById('listTitle');

        // Only update text content if the element is NOT currently focused (editing)
        // This prevents the cursor from resetting while the user is typing
        if (mainTitle && titles.mainTitle && document.activeElement !== mainTitle) {
            mainTitle.textContent = titles.mainTitle;
        }
        if (subtitle && titles.subtitle && document.activeElement !== subtitle) {
            subtitle.textContent = titles.subtitle;
        }
        if (listTitle && titles.listTitle && document.activeElement !== listTitle) {
            listTitle.textContent = titles.listTitle;
        }
    }

    /**
     * Save current titles to state
     */
    saveTitles() {
        const mainTitle = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        const listTitle = document.getElementById('listTitle');

        this.stateManager.setState({
            titles: {
                mainTitle: mainTitle?.textContent || 'Visual List Builder',
                subtitle: subtitle?.textContent || 'Create beautiful visual lists with text and images',
                listTitle: listTitle?.textContent || 'Your Visual List'
            }
        });
    }

    /**
     * Show undo notification
     * @param {string} action - Action that was undone
     * @param {Object} data - Action data
     */
    showUndoNotification(action, data) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9em;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
        `;

        let message = '';
        switch(action) {
            case 'deleteItem':
                message = `Restored: "${data.title || 'Untitled'}"`;
                break;
            case 'deleteAuthor':
                message = `Restored author: "${data.author}" (${data.itemCount} items)`;
                break;
            default:
                message = 'Action undone';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Update storage info display
     */
    async updateStorageInfo() {
        const storageInfo = await this.listManager.getStorageInfo();
        const element = document.getElementById('storageInfo');
        const state = this.stateManager.getState();
        const itemCount = state.items.length;
        
        if (element) {
            let icon = '🟢';
            let percentUsed = 0;
            let quotaText = '';
            
            // Determine quota based on storage type and mode
            const sizeBytes = storageInfo.size;
            
            if (storageInfo.isCloud) {
                // Cloud Mode: Quota is virtually unlimited (1GB+ on Firebase)
                // Local cache size is just informational
                icon = '☁️';
                quotaText = 'Synced';
            } else {
                // Local Mode
                let estimatedQuota;
                
                if (storageInfo.type === 'IndexedDB') {
                    estimatedQuota = 50 * 1024 * 1024; // 50MB
                } else {
                    estimatedQuota = 5 * 1024 * 1024; // 5MB
                }
                
                percentUsed = ((sizeBytes / estimatedQuota) * 100).toFixed(0);
                
                if (percentUsed > 90) icon = '⚠️';
                else if (percentUsed > 70) icon = '🟡';
                
                quotaText = percentUsed > 10 ? `(${percentUsed}%)` : '';
            }
            
            element.innerHTML = `
                <span class="auto-save-indicator" title="Storage: ${storageInfo.type}">${icon} ${itemCount} items • ${storageInfo.formattedSize} ${quotaText}</span>
            `;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Preserve text formatting (keep newlines, etc.)
     * @param {string} text - Text to preserve
     * @returns {string} Formatted HTML
     */
    preserveText(text) {
        if (!text) return '';
        if (/<\/?[a-z][\s\S]*>/i.test(text)) {
            return Validators.sanitizeRichText(text);
        }
        return text
            .split('\n')
            .map(line => this.escapeHtml(line))
            .join('<br>');
    }
}

export default UIManager;

