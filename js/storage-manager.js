/**
 * GrowthVault - Storage Manager
 * Handles localStorage persistence operations
 */

import { CONFIG } from './config.js';

export class StorageManager {
    constructor(storageKey = CONFIG.STORAGE_KEY) {
        this.baseStorageKey = storageKey;
        this.storageKey = storageKey; // Will be updated when user signs in/out
        this.currentUserId = null;
    }

    /**
     * Update storage key based on user authentication
     * @param {string|null} userId - User ID (email) or null for anonymous
     */
    setUser(userId) {
        this.currentUserId = userId;
        if (userId) {
            // User-specific storage key
            this.storageKey = `${this.baseStorageKey}_${userId}`;
        } else {
            // Anonymous storage key
            this.storageKey = this.baseStorageKey;
        }
        console.log('🔑 Storage key set to:', this.storageKey);
    }

    /**
     * Save complete application state to localStorage
     * @param {Object} data - Data to save (items, counter, order, undo, titles, etc.)
     * @returns {Object} {success: boolean, error?: string}
     */
    save(data) {
        try {
            const dataToSave = {
                ...data,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            console.log('✅ Saved to localStorage:', this.storageKey);
            return { success: true, timestamp: dataToSave.timestamp };
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load application state from localStorage
     * @returns {Object|null} Saved data or null if not found/error
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                console.log('ℹ️  No saved data found in localStorage');
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
     * Clear all data from localStorage
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('✅ Cleared localStorage:', this.storageKey);
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get size of stored data in bytes
     * @returns {number} Size in bytes
     */
    getSize() {
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
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get human-readable storage size
     * @returns {string} Size with unit (KB/MB)
     */
    getFormattedSize() {
        const bytes = this.getSize();
        if (bytes === 0) return '0 Bytes';
        if (bytes < 1024) return bytes + ' Bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

export default StorageManager;

