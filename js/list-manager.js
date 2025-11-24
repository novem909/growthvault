/**
 * GrowthVault - List Manager
 * Handles CRUD operations for items, undo/redo, and data management
 */

import { CONFIG } from './config.js';
import { Validators } from './validators.js';

export class ListManager {
    constructor(stateManager, storageManager, firebaseManager = null) {
        this.stateManager = stateManager;
        this.storageManager = storageManager;
        this.firebaseManager = firebaseManager;
        
        console.log('📋 ListManager initialized');
    }
    
    /**
     * Set Firebase Manager (called after initialization)
     * @param {FirebaseManager} firebaseManager
     */
    setFirebaseManager(firebaseManager) {
        this.firebaseManager = firebaseManager;
    }

    /**
     * Add a new item to the list
     * @param {Object} itemData - {author, title, text, imageFile?}
     * @returns {Promise<Object>} {success: boolean, item?: Object, error?: string}
     */
    async addItem(itemData) {
        const { author, title, text, imageFile } = itemData;

        const sanitizedText = text ? Validators.sanitizeRichText(text) : '';
        const plainText = Validators.extractTextFromHtml(sanitizedText).trim();

        // Validate author
        const authorCheck = Validators.validateAuthor(author);
        if (!authorCheck.valid) {
            return { success: false, error: authorCheck.error };
        }

        // Validate text or image exists
        if ((!plainText || plainText.length === 0) && !imageFile) {
            return { success: false, error: 'Please enter text or select an image' };
        }

        if (sanitizedText) {
            const textCheck = Validators.validateText(sanitizedText, 0, 50000);
            if (!textCheck.valid) {
                return { success: false, error: textCheck.error };
            }
        }

        // Validate image if provided
        if (imageFile) {
            const imageCheck = Validators.validateImage(imageFile);
            if (!imageCheck.valid) {
                return { success: false, error: imageCheck.error };
            }
        }

        // Create item
        const now = new Date();
        const item = {
            id: Date.now(),
            date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            author: author.trim(),
            title: title?.trim() || 'Untitled',
            text: sanitizedText,
            image: null
        };

        // Handle image upload if present
        if (imageFile) {
            try {
                item.image = await this.readImageFile(imageFile);
                console.log('📷 Image loaded, size:', item.image.length, 'bytes');
            } catch (error) {
                console.error('❌ Failed to read image:', error);
                return { success: false, error: 'Failed to read image file' };
            }
        }

        // Add to state
        const state = this.stateManager.getState();
        const newItems = [...state.items, item];
        
        console.log('➕ Adding item:', {
            id: item.id,
            author: item.author,
            title: item.title,
            hasText: plainText.length > 0,
            hasImage: !!item.image
        });
        
        this.stateManager.setState({ 
            items: newItems,
            itemCounter: state.itemCounter + 1
        });

        // Save to storage
        const saveResult = await this.save();

        if (!saveResult.success) {
            // Revert state if save failed
            this.stateManager.setState({
                items: state.items,
                itemCounter: state.itemCounter
            });
            console.error('❌ Failed to save item:', saveResult.error);
            
            // Provide helpful error message with context
            const storageInfo = this.getStorageInfo();
            const attemptedSize = saveResult.attemptedSize || 0;
            const attemptedSizeFormatted = this.storageManager.formatBytes(attemptedSize);
            
            let errorMsg;
            if (saveResult.errorName === 'QuotaExceededError' || 
                saveResult.error.toLowerCase().includes('quota')) {
                errorMsg = `Storage full! Current: ${storageInfo.formattedSize}, Tried to save: ${attemptedSizeFormatted}. Delete old items or sign in to sync to cloud.`;
            } else if (saveResult.error.includes('not available')) {
                errorMsg = saveResult.error; // Already has helpful message
            } else {
                errorMsg = `Failed to save: ${saveResult.error}`;
            }
            
            return { success: false, error: errorMsg };
        }

        if (saveResult.syncPromise) {
            try {
                await saveResult.syncPromise;
            } catch (error) {
                console.error('❌ Sync failed during add item:', error);
                // Return success true because it IS saved locally, but warn about sync
                // The UI might want to know this, but for now we keep it simple
            }
        }

        console.log('✅ Item added:', item.id);
        return { success: true, item };
    }

    /**
     * Delete an item by ID
     * @param {number} id - Item ID
     * @param {boolean} saveUndo - Whether to save undo state (default true)
     * @returns {Promise<Object>} {success: boolean, item?: Object}
     */
    async deleteItem(id, saveUndo = true) {
        const state = this.stateManager.getState();
        const item = state.items.find(item => item.id === id);
        
        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        // Save undo state
        if (saveUndo) {
            this.saveStateForUndo('deleteItem', {
                itemId: id,
                title: item.title,
                author: item.author
            });
        }

        // Remove item
        const newItems = state.items.filter(item => item.id !== id);
        this.stateManager.setState({ items: newItems });
        
        await this.save();

        console.log('🗑️  Item deleted:', id);
        return { success: true, item };
    }

    /**
     * Delete all items by author
     * @param {string} author - Author name
     * @returns {Promise<Object>} {success: boolean, count: number}
     */
    async deleteAuthor(author) {
        const state = this.stateManager.getState();
        const itemsToDelete = state.items.filter(item => item.author === author);
        
        if (itemsToDelete.length === 0) {
            return { success: false, error: 'No items found for this author' };
        }

        // Save undo state
        this.saveStateForUndo('deleteAuthor', {
            author: author,
            itemCount: itemsToDelete.length
        });

        // Remove all items by this author
        const newItems = state.items.filter(item => item.author !== author);
        const newAuthorOrder = state.authorOrder.filter(a => a !== author);
        
        this.stateManager.setState({ 
            items: newItems,
            authorOrder: newAuthorOrder
        });
        
        await this.save();

        console.log(`🗑️  Deleted ${itemsToDelete.length} items by author:`, author);
        return { success: true, count: itemsToDelete.length };
    }

    /**
     * Clear all data
     * @returns {Promise<Object>} {success: boolean}
     */
    async clearAllData() {
        const state = this.stateManager.getState();
        
        if (state.items.length === 0) {
            return { success: false, error: 'No data to clear' };
        }

        // Reset state
        this.stateManager.setState({
            items: [],
            itemCounter: 1,
            authorOrder: [],
            undoStack: []
        });

        // Clear storage
        await this.storageManager.clear();

        console.log('🗑️  All data cleared');
        return { success: true };
    }

    /**
     * Export data as JSON
     * @returns {Object} Data object for export
     */
    exportData() {
        const state = this.stateManager.getStateForSaving();
        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `growthvault-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📤 Data exported');
        return state;
    }

    /**
     * Import data from JSON file
     * @param {File} file - JSON file
     * @returns {Promise<Object>} {success: boolean, error?: string}
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate import data
            const validation = Validators.validateImportData(data);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Load into state
            this.stateManager.loadState(data);
            
            // Save to storage
            const saveResult = await this.save();
            if (saveResult.syncPromise) {
                await saveResult.syncPromise;
            }
            
            console.log('📥 Data imported:', data.items.length, 'items');
            return { success: true, itemCount: data.items.length };
        } catch (error) {
            console.error('❌ Import failed:', error);
            return { success: false, error: 'Invalid JSON file' };
        }
    }

    /**
     * Group items by author
     * @returns {Map} Map of author -> items[]
     */
    groupItemsByAuthor() {
        const state = this.stateManager.getState();
        const grouped = new Map();
        
        state.items.forEach(item => {
            if (!grouped.has(item.author)) {
                grouped.set(item.author, []);
            }
            grouped.get(item.author).push(item);
        });
        
        return grouped;
    }

    /**
     * Get ordered list of authors
     * @returns {Array} Ordered author names
     */
    getOrderedAuthors() {
        const state = this.stateManager.getState();
        const grouped = this.groupItemsByAuthor();
        const authors = Array.from(grouped.keys());
        
        // Sort based on authorOrder, then by first appearance
        return authors.sort((a, b) => {
            const aIndex = state.authorOrder.indexOf(a);
            const bIndex = state.authorOrder.indexOf(b);
            
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return 0;
        });
    }

    /**
     * Reorder items by drag and drop
     * @param {number} draggedId - ID of dragged item
     * @param {number} targetId - ID of target item
     */
    async reorderItems(draggedId, targetId) {
        const state = this.stateManager.getState();
        const items = [...state.items];
        
        const draggedIndex = items.findIndex(item => item.id === draggedId);
        const targetIndex = items.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            return { success: false, error: 'Item not found' };
        }

        // Remove dragged item and insert at target position
        const [draggedItem] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedItem);
        
        this.stateManager.setState({ items });
        await this.save();
        
        console.log('🔄 Items reordered');
        return { success: true };
    }

    /**
     * Update author order
     * @param {Array} newOrder - New author order array
     */
    async updateAuthorOrder(newOrder) {
        this.stateManager.setState({ authorOrder: newOrder });
        await this.save();
        console.log('🔄 Author order updated:', newOrder);
    }

    /**
     * Save state for undo - stores only deleted items, not entire state
     * @param {string} action - Action name
     * @param {Object} data - Action data
     */
    saveStateForUndo(action, data) {
        const state = this.stateManager.getState();
        
        // Only store the specific items being deleted, not the entire state
        let deletedItems = [];
        if (action === 'deleteItem' && data.itemId) {
            const item = state.items.find(i => i.id === data.itemId);
            if (item) deletedItems = [item];
        } else if (action === 'deleteAuthor' && data.author) {
            deletedItems = state.items.filter(i => i.author === data.author);
        }
        
        const undoState = {
            action: action,
            data: data,
            deletedItems: deletedItems, // Store only deleted items, not full state
            authorOrder: [...state.authorOrder],
            timestamp: Date.now()
        };

        const newUndoStack = [...state.undoStack, undoState];
        
        // Keep only last N operations
        if (newUndoStack.length > CONFIG.MAX_UNDO_HISTORY) {
            newUndoStack.shift();
        }

        this.stateManager.setState({ undoStack: newUndoStack });
        console.log('💾 Undo state saved:', action, `(${deletedItems.length} items)`);
    }

    /**
     * Undo last action
     * @returns {Promise<Object>} {success: boolean, action?: string}
     */
    async undo() {
        const state = this.stateManager.getState();
        
        if (state.undoStack.length === 0) {
            console.log('ℹ️  Nothing to undo');
            return { success: false, error: 'Nothing to undo' };
        }

        const lastState = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);
        
        // Handle both old format (items) and new format (deletedItems)
        let restoredItems;
        if (lastState.deletedItems) {
            // New format: restore only deleted items
            restoredItems = [...state.items, ...lastState.deletedItems];
        } else if (lastState.items) {
            // Old format: restore entire state (migration path)
            restoredItems = JSON.parse(JSON.stringify(lastState.items));
            console.warn('⚠️  Using old undo format - consider clearing undo history');
        } else {
            console.error('❌ Invalid undo state');
            return { success: false, error: 'Invalid undo state' };
        }
        
        this.stateManager.setState({
            items: restoredItems,
            authorOrder: [...lastState.authorOrder],
            undoStack: newUndoStack
        });
        
        await this.save();
        
        const itemCount = lastState.deletedItems?.length || '?';
        console.log('↩️  Undone action:', lastState.action, `(restored ${itemCount} items)`);
        return { 
            success: true, 
            action: lastState.action,
            data: lastState.data
        };
    }

    /**
     * Save current state to storage and sync to Firebase if logged in
     * @param {boolean} skipFirebaseSync - Skip Firebase sync (used when loading from Firebase)
     * @param {Object} options - Save options
     * @param {boolean} options.preserveTimestamp - Whether to preserve existing timestamp (default: false)
     */
    async save(skipFirebaseSync = false, options = {}) {
        const state = this.stateManager.getStateForSaving();
        
        // Implement Monotonic Timestamp Logic for local saves
        // This ensures we always advance the timestamp, even if the system clock is behind (clock skew),
        // solving the issue where Mobile -> Web sync fails because Mobile time < Web time.
        if (!options.preserveTimestamp) {
            const lastTimestamp = this.stateManager.get('lastSaveTimestamp') || 0;
            const now = Date.now();
            
            // Ensure we always move forward, even if system clock is slow
            const nextTimestamp = Math.max(now, lastTimestamp + 1);
            
            if (nextTimestamp > now) {
                console.warn('⚠️ Clock skew detected: System time is behind last save. Adjusting timestamp forward.', {
                    now,
                    last: lastTimestamp,
                    adjusted: nextTimestamp,
                    diff: nextTimestamp - now
                });
            }
            
            state.timestamp = new Date(nextTimestamp).toISOString();
            
            // Force storage to use our calculated timestamp
            options.preserveTimestamp = true;
        }

        const result = await this.storageManager.save(state, options);
        let syncPromise = Promise.resolve();
        
        if (result.success) {
            this.stateManager.setState({ lastSaveTimestamp: new Date(result.timestamp).getTime() });
            
            // Sync to Firebase if user is logged in (unless we're loading from Firebase)
            if (!skipFirebaseSync && this.firebaseManager && this.firebaseManager.currentUser) {
                syncPromise = this.firebaseManager.sync().catch(error => {
                    console.error('❌ Firebase sync failed:', error);
                });
            }
        }
        
        return { ...result, syncPromise };
    }

    /**
     * Load state from storage
     */
    async load() {
        const data = await this.storageManager.load();
        if (data) {
            this.stateManager.loadState(data);
            console.log('📥 State loaded from storage');
            return { success: true };
        }
        return { success: false };
    }

    /**
     * Read image file as data URL with compression
     * @param {File} file - Image file
     * @returns {Promise<string>} Compressed data URL
     */
    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        // Compress image to reduce storage size
                        const compressed = this.compressImage(img, file.type);
                        console.log('📷 Image compressed:', {
                            original: file.size,
                            compressed: compressed.length,
                            reduction: ((1 - compressed.length / file.size) * 100).toFixed(1) + '%'
                        });
                        resolve(compressed);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Compress image to reduce storage size
     * @param {HTMLImageElement} img - Image element
     * @param {string} mimeType - Original MIME type
     * @returns {string} Compressed data URL
     */
    compressImage(img, mimeType) {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large - aggressive compression for mobile to avoid storage issues
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const maxDimension = isMobile ? 800 : 1920; // Reduced from 1280 to 800 for mobile
        
        console.log('🖼️  Original dimensions:', { width, height, isMobile });
        
        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
            } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
            }
            console.log('📐 Resized to:', { width: Math.round(width), height: Math.round(height) });
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // More aggressive quality reduction on mobile
        const quality = isMobile ? 0.6 : 0.8; // Reduced from 0.7 to 0.6 for mobile
        
        // Always convert to JPEG for better compression (PNG is much larger)
        const outputType = 'image/jpeg';
        
        const result = canvas.toDataURL(outputType, quality);
        console.log('✂️  Compression settings:', { quality, outputType, isMobile });
        
        return result;
    }

    /**
     * Get storage usage info
     * @returns {Promise<Object>} Storage info
     */
    async getStorageInfo() {
        return {
            size: await this.storageManager.getSize(),
            formattedSize: await this.storageManager.getFormattedSize(),
            isAvailable: this.storageManager.isAvailable()
        };
    }
}

export default ListManager;

