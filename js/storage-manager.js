/**
 * GrowthVault - Storage Manager
 * Handles localStorage persistence operations
 */

import { CONFIG } from './config.js';

export class StorageManager {
    constructor(storageKey = CONFIG.STORAGE_KEY) {
        this.storageKey = storageKey;
    }

    /**
     * Save complete application state to localStorage
     * @param {Object} data - Data to save (items, counter, order, undo, titles, etc.)
     * @returns {Object} {success: boolean, error?: string, attemptedSize?: number}
     */
    save(data) {
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

            // Preserve existing timestamp if present (from Firebase), otherwise create new one
            const timestamp = data.timestamp || new Date().toISOString();
            
            const dataToSave = {
                ...data,
                timestamp: timestamp
            };
            
            const jsonString = JSON.stringify(dataToSave);
            const attemptedSize = new Blob([jsonString]).size;
            
            console.log('💾 Attempting to save:', {
                size: this.formatBytes(attemptedSize),
                items: data.items?.length || 0
            });
            
            localStorage.setItem(this.storageKey, jsonString);
            console.log('✅ Saved to localStorage:', this.storageKey, timestamp === data.timestamp ? '(preserved timestamp)' : '(new timestamp)');
            return { success: true, timestamp: timestamp, attemptedSize };
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            
            // Calculate size of failed attempt
            const jsonString = JSON.stringify(data);
            const attemptedSize = new Blob([jsonString]).size;
            
            return { 
                success: false, 
                error: error.message,
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

