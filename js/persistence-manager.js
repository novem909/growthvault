/**
 * GrowthVault - Persistence Manager
 * Orchestrates data persistence across Firebase (Source of Truth) and Local Storage (Cache)
 * Implements the "Firebase First" architecture
 */

export class PersistenceManager {
    /**
     * @param {StorageManager} storageManager - Local storage (cache)
     * @param {FirebaseManager} firebaseManager - Remote storage (source of truth)
     * @param {StateManager} stateManager - Application state
     */
    constructor(storageManager, firebaseManager, stateManager) {
        this.storage = storageManager;
        this.firebase = firebaseManager;
        this.state = stateManager;
    }

    /**
     * Save data to persistence layer
     * Strategy: Firebase First -> Local Cache
     * @param {Object} data - State data to save
     * @param {Object} options - Save options
     * @param {boolean} options.localOnly - If true, skip Firebase and only save to local cache
     * @param {boolean} options.preserveTimestamp - Whether to preserve existing timestamp
     * @returns {Promise<Object>} Result { success, error, source }
     */
    async save(data, options = {}) {
        const isLoggedIn = this.firebase && this.firebase.currentUser;
        
        // 1. If logged in and NOT localOnly, try Firebase first (Source of Truth)
        if (isLoggedIn && !options.localOnly) {
            try {
                console.log('☁️ Persistence: Saving to Firebase...');
                await this.firebase.saveToFirebase(data);
                
                // 2. If successful, update local cache
                console.log('💾 Persistence: Updating local cache...');
                // We preserve timestamp in local cache because it was just authorized by Firebase
                await this.storage.save(data, { ...options, preserveTimestamp: true });
                
                return { success: true, source: 'firebase' };
            } catch (error) {
                console.error('❌ Persistence: Firebase save failed, falling back to local:', error);
                // Fallthrough to local save (offline support)
            }
        }

        // 3. Local Only / Offline Fallback
        try {
            console.log('💾 Persistence: Saving locally...');
            const result = await this.storage.save(data, options);
            return { ...result, source: 'local' };
        } catch (error) {
            return { success: false, error: error.message, source: 'local' };
        }
    }

    /**
     * Load data from persistence layer
     * Strategy: Firebase First -> Local Cache
     * @returns {Promise<Object>} Result { success, data, source }
     */
    async load() {
        const isLoggedIn = this.firebase && this.firebase.currentUser;

        // 1. If logged in, try Firebase first
        if (isLoggedIn) {
            try {
                console.log('☁️ Persistence: Loading from Firebase...');
                // FirebaseManager.loadFromFirebase currently handles the state update logic
                // We trigger it here
                await this.firebase.loadFromFirebase();
                return { success: true, source: 'firebase' };
            } catch (error) {
                console.error('❌ Persistence: Firebase load failed, falling back to local cache:', error);
            }
        }

        // 2. Local Only / Offline Fallback
        try {
            console.log('💾 Persistence: Loading from local cache...');
            const data = await this.storage.load();
            if (data) {
                this.state.loadState(data);
                return { success: true, data, source: 'local' };
            }
            return { success: false, source: 'local' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Clear all data
     */
    async clear() {
        // Clear local
        await this.storage.clear();
        return { success: true };
    }

    /**
     * Get storage usage info (proxies to local storage manager)
     */
    async getStorageInfo() {
        if (this.storage) {
            return {
                size: await this.storage.getSize(),
                formattedSize: await this.storage.getFormattedSize(),
                isAvailable: this.storage.isAvailable()
            };
        }
        return { size: 0, formattedSize: '0 B', isAvailable: false };
    }
}
