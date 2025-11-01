/**
 * GrowthVault - List Manager
 * Handles CRUD operations for items, undo/redo, and data management
 */

import { CONFIG } from './config.js';
import { Validators } from './validators.js';

export class ListManager {
    constructor(stateManager, storageManager) {
        this.stateManager = stateManager;
        this.storageManager = storageManager;
        
        console.log('📋 ListManager initialized');
    }

    /**
     * Add a new item to the list
     * @param {Object} itemData - {author, title, text, imageFile?}
     * @returns {Promise<Object>} {success: boolean, item?: Object, error?: string}
     */
    async addItem(itemData) {
        const { author, title, text, imageFile } = itemData;

        // Validate author
        const authorCheck = Validators.validateAuthor(author);
        if (!authorCheck.valid) {
            return { success: false, error: authorCheck.error };
        }

        // Validate text or image exists
        if ((!text || text.trim().length === 0) && !imageFile) {
            return { success: false, error: 'Please enter text or select an image' };
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
            text: text, // Preserve formatting
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
            hasText: !!item.text,
            hasImage: !!item.image
        });
        
        this.stateManager.setState({ 
            items: newItems,
            itemCounter: state.itemCounter + 1
        });

        // Save to storage
        this.save();

        console.log('✅ Item added:', item.id);
        return { success: true, item };
    }

    /**
     * Delete an item by ID
     * @param {number} id - Item ID
     * @param {boolean} saveUndo - Whether to save undo state (default true)
     * @returns {Object} {success: boolean, item?: Object}
     */
    deleteItem(id, saveUndo = true) {
        const state = this.stateManager.getState();
        const item = state.items.find(item => item.id === id);
        
        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        // Save undo state
        if (saveUndo) {
            this.saveStateForUndo('deleteItem', {
                title: item.title,
                author: item.author
            });
        }

        // Remove item
        const newItems = state.items.filter(item => item.id !== id);
        this.stateManager.setState({ items: newItems });
        
        this.save();

        console.log('🗑️  Item deleted:', id);
        return { success: true, item };
    }

    /**
     * Delete all items by author
     * @param {string} author - Author name
     * @returns {Object} {success: boolean, count: number}
     */
    deleteAuthor(author) {
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
        
        this.save();

        console.log(`🗑️  Deleted ${itemsToDelete.length} items by author:`, author);
        return { success: true, count: itemsToDelete.length };
    }

    /**
     * Clear all data
     * @returns {Object} {success: boolean}
     */
    clearAllData() {
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
        this.storageManager.clear();

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
            this.save();
            
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
    reorderItems(draggedId, targetId) {
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
        this.save();
        
        console.log('🔄 Items reordered');
        return { success: true };
    }

    /**
     * Update author order
     * @param {Array} newOrder - New author order array
     */
    updateAuthorOrder(newOrder) {
        this.stateManager.setState({ authorOrder: newOrder });
        this.save();
        console.log('🔄 Author order updated:', newOrder);
    }

    /**
     * Save state for undo
     * @param {string} action - Action name
     * @param {Object} data - Action data
     */
    saveStateForUndo(action, data) {
        const state = this.stateManager.getState();
        const undoState = {
            action: action,
            data: data,
            items: JSON.parse(JSON.stringify(state.items)),
            authorOrder: [...state.authorOrder],
            timestamp: Date.now()
        };

        const newUndoStack = [...state.undoStack, undoState];
        
        // Keep only last N operations
        if (newUndoStack.length > CONFIG.MAX_UNDO_HISTORY) {
            newUndoStack.shift();
        }

        this.stateManager.setState({ undoStack: newUndoStack });
        console.log('💾 Undo state saved:', action);
    }

    /**
     * Undo last action
     * @returns {Object} {success: boolean, action?: string}
     */
    undo() {
        const state = this.stateManager.getState();
        
        if (state.undoStack.length === 0) {
            console.log('ℹ️  Nothing to undo');
            return { success: false, error: 'Nothing to undo' };
        }

        const lastState = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);
        
        // Restore the state before the action
        this.stateManager.setState({
            items: JSON.parse(JSON.stringify(lastState.items)),
            authorOrder: [...lastState.authorOrder],
            undoStack: newUndoStack
        });
        
        this.save();
        
        console.log('↩️  Undone action:', lastState.action);
        return { 
            success: true, 
            action: lastState.action,
            data: lastState.data
        };
    }

    /**
     * Save current state to storage
     */
    save() {
        const state = this.stateManager.getStateForSaving();
        const result = this.storageManager.save(state);
        
        if (result.success) {
            this.stateManager.setState({ lastSaveTimestamp: new Date(result.timestamp).getTime() });
        }
        
        return result;
    }

    /**
     * Load state from storage
     */
    load() {
        const data = this.storageManager.load();
        if (data) {
            this.stateManager.loadState(data);
            console.log('📥 State loaded from storage');
            return { success: true };
        }
        return { success: false };
    }

    /**
     * Read image file as data URL
     * @param {File} file - Image file
     * @returns {Promise<string>} Data URL
     */
    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get storage usage info
     * @returns {Object} Storage info
     */
    getStorageInfo() {
        return {
            size: this.storageManager.getSize(),
            formattedSize: this.storageManager.getFormattedSize(),
            isAvailable: this.storageManager.isAvailable()
        };
    }
}

export default ListManager;

