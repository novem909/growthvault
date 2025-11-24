/**
 * GrowthVault - Storage Manager
 * Handles storage with IndexedDB (large data) and localStorage (fallback)
 */

import { CONFIG } from './config.js';
import { IndexedDBManager } from './indexeddb-manager.js';

export class StorageManager {
    constructor(storageKey = CONFIG.STORAGE_KEY) {
        this.storageKey = storageKey;
        this.indexedDB = new IndexedDBManager();
        this.useIndexedDB = false;
        this.initPromise = this.initStorage();
    }

    /**
     * Initialize storage, prefer IndexedDB for larger capacity
     */
    async initStorage() {
        try {
            if (this.indexedDB.isAvailable()) {
                await this.indexedDB.init();
                this.useIndexedDB = true;
                console.log('✅ Using IndexedDB for storage (50MB+ capacity)');
                
                // Check if we need to migrate from localStorage
                await this.migrateIfNeeded();
            } else {
                console.log('⚠️ IndexedDB not available, using localStorage (5MB limit)');
            }
        } catch (error) {
            console.error('❌ Failed to initialize IndexedDB, falling back to localStorage:', error);
            this.useIndexedDB = false;
        }
    }

    /**
     * Migrate data from localStorage to IndexedDB if needed
     */
    async migrateIfNeeded() {
        try {
            // Check if localStorage has data but IndexedDB doesn't
            const localData = this.loadFromLocalStorage();
            if (localData) {
                const indexedData = await this.indexedDB.load();
                if (!indexedData) {
                    console.log('🔄 Migrating data from localStorage to IndexedDB...');
                    await this.indexedDB.save(localData);
                    // Clear localStorage after successful migration
                    localStorage.removeItem(this.storageKey);
                    console.log('✅ Migration complete, localStorage cleared');
                }
            }
        } catch (error) {
            console.error('❌ Migration failed:', error);
        }
    }

    /**
     * Load data from localStorage (internal method)
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return null;
            return JSON.parse(saved);
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * Save complete application state to storage (IndexedDB or localStorage)
     * @param {Object} data - Data to save (items, counter, order, undo, titles, etc.)
     * @param {Object} options - Save options
     * @param {boolean} options.preserveTimestamp - Whether to preserve existing timestamp
     * @returns {Promise<Object>} {success: boolean, error?: string, attemptedSize?: number}
     */
    async save(data, options = {}) {
        // Ensure storage is initialized
        await this.initPromise;

        // Try IndexedDB first (much higher capacity)
        if (this.useIndexedDB) {
            try {
                const result = await this.indexedDB.save(data, options);
                return { 
                    success: true, 
                    timestamp: result.timestamp,
                    attemptedSize: result.size,
                    storageType: 'IndexedDB'
                };
            } catch (error) {
                console.error('❌ IndexedDB save failed, trying localStorage:', error);
                // Fall back to localStorage
                this.useIndexedDB = false;
            }
        }

        // Fall back to localStorage (or use directly if IndexedDB not available)
        return this.saveToLocalStorage(data, options);
    }

    /**
     * Save to localStorage (fallback method)
     */
    saveToLocalStorage(data, options = {}) {
        try {
            // Check if localStorage is available
            if (!this.isAvailable()) {
                console.error('❌ localStorage is not available');
                return { 
                    success: false, 
                    error: 'Storage not available. Check if private/incognito mode is enabled.',
                    attemptedSize: 0
                };
            }

            // Preserve existing timestamp if requested and present, otherwise create new one
            let timestamp;
            if (options.preserveTimestamp && data.timestamp) {
                timestamp = data.timestamp;
            } else {
                timestamp = new Date().toISOString();
            }
            
            const dataToSave = {
                ...data,
                timestamp: timestamp
            };
            
            const jsonString = JSON.stringify(dataToSave);
            const attemptedSize = new Blob([jsonString]).size;
            
            // Check current storage before attempting save
            const currentData = localStorage.getItem(this.storageKey);
            const currentSize = currentData ? new Blob([currentData]).size : 0;
            
            console.log('💾 Attempting to save:', {
                currentSize: this.formatBytes(currentSize),
                newSize: this.formatBytes(attemptedSize),
                items: data.items?.length || 0,
                hasUndoStack: (data.undoStack?.length || 0) > 0
            });
            
            // Try to detect if we're about to exceed quota
            if (attemptedSize > 4 * 1024 * 1024) { // Warning at 4MB
                console.warn('⚠️  Large data size detected:', this.formatBytes(attemptedSize));
            }
            
            localStorage.setItem(this.storageKey, jsonString);
            console.log('✅ Saved to localStorage:', this.storageKey, timestamp === data.timestamp ? '(preserved timestamp)' : '(new timestamp)');
            return { success: true, timestamp: timestamp, attemptedSize };
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error, {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            // Calculate size of failed attempt
            let attemptedSize = 0;
            try {
                const jsonString = JSON.stringify(data);
                attemptedSize = new Blob([jsonString]).size;
            } catch (e) {
                console.error('❌ Could not calculate size:', e);
            }
            
            // More specific error messages
            let errorMessage = error.message;
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                errorMessage = 'Storage quota exceeded. Try clearing old data or signing in to sync.';
            } else if (error.name === 'SecurityError') {
                errorMessage = 'Storage blocked by browser security settings. Check if cookies are enabled.';
            }
            
            return { 
                success: false, 
                error: errorMessage,
                errorName: error.name,
                attemptedSize
            };
        }
    }
    
    /**
     * Format bytes to human-readable size
     * @param {number} bytes
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        if (bytes < 1024) return bytes + ' Bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Load application state from storage (IndexedDB or localStorage)
     * @returns {Promise<Object|null>} Saved data or null if not found/error
     */
    async load() {
        // Ensure storage is initialized
        await this.initPromise;

        // Try IndexedDB first
        if (this.useIndexedDB) {
            try {
                const data = await this.indexedDB.load();
                if (data) {
                    console.log('✅ Loaded from IndexedDB');
                    return data;
                }
            } catch (error) {
                console.error('❌ Failed to load from IndexedDB:', error);
                // Fall back to localStorage
            }
        }

        // Fall back to localStorage
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                console.log('ℹ️  No saved data found');
                return null;
            }

            const data = JSON.parse(saved);
            console.log('✅ Loaded from localStorage:', this.storageKey);
            return data;
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * Clear all data from storage (IndexedDB and localStorage)
     */
    async clear() {
        await this.initPromise;
        
        const results = [];
        
        // Clear IndexedDB if available
        if (this.useIndexedDB) {
            try {
                await this.indexedDB.clear();
                results.push('IndexedDB cleared');
            } catch (error) {
                console.error('❌ Failed to clear IndexedDB:', error);
            }
        }
        
        // Clear localStorage
        try {
            localStorage.removeItem(this.storageKey);
            results.push('localStorage cleared');
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
        }
        
        console.log('✅ Storage cleared:', results.join(', '));
        return { success: true };
    }

    /**
     * Get size of stored data in bytes
     * @returns {Promise<number>} Size in bytes
     */
    async getSize() {
        await this.initPromise;
        
        // Try IndexedDB first
        if (this.useIndexedDB) {
            try {
                return await this.indexedDB.getSize();
            } catch (error) {
                console.error('❌ Failed to get IndexedDB size:', error);
            }
        }
        
        // Fall back to localStorage
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            console.error('❌ Failed to get storage size:', error);
            return 0;
        }
    }

    /**
     * Check if storage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            if (typeof localStorage === 'undefined') {
                console.error('❌ localStorage is undefined');
                return false;
            }
            
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('❌ localStorage availability check failed:', error.name, error.message);
            return false;
        }
    }

    /**
     * Get human-readable storage size
     * @returns {Promise<string>} Size with unit (KB/MB)
     */
    async getFormattedSize() {
        const bytes = await this.getSize();
        if (bytes === 0) return '0 Bytes';
        if (bytes < 1024) return bytes + ' Bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

export default StorageManager;

