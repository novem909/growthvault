/**
 * GrowthVault - IndexedDB Manager
 * Handles large storage using IndexedDB (50MB-unlimited vs localStorage 5MB limit)
 */

export class IndexedDBManager {
    constructor(dbName = 'GrowthVaultDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.storeName = 'appData';
    }

    /**
     * Initialize IndexedDB
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.error('❌ IndexedDB not supported');
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('📦 Created IndexedDB store:', this.storeName);
                }
            };
        });
    }

    /**
     * Save data to IndexedDB
     * @param {Object} data - Data to save
     * @returns {Promise<Object>} Result with success status
     */
    async save(data) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                // Add metadata
                const timestamp = data.timestamp || new Date().toISOString();
                const dataToSave = {
                    id: 'visualListBuilder_data', // Single document approach
                    ...data,
                    timestamp: timestamp,
                    lastModified: Date.now()
                };

                // Calculate size for logging
                const size = new Blob([JSON.stringify(dataToSave)]).size;
                console.log('💾 Saving to IndexedDB:', {
                    size: this.formatBytes(size),
                    items: data.items?.length || 0,
                    timestamp: timestamp
                });

                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(dataToSave);

                request.onsuccess = () => {
                    console.log('✅ Saved to IndexedDB successfully');
                    resolve({ 
                        success: true, 
                        timestamp: timestamp,
                        size: size 
                    });
                };

                request.onerror = () => {
                    console.error('❌ Failed to save to IndexedDB:', request.error);
                    reject(request.error);
                };

                transaction.onerror = () => {
                    console.error('❌ IndexedDB transaction failed:', transaction.error);
                    reject(transaction.error);
                };

            } catch (error) {
                console.error('❌ IndexedDB save error:', error);
                reject(error);
            }
        });
    }

    /**
     * Load data from IndexedDB
     * @returns {Promise<Object|null>} Saved data or null
     */
    async load() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get('visualListBuilder_data');

                request.onsuccess = () => {
                    const data = request.result;
                    if (data) {
                        console.log('✅ Loaded from IndexedDB:', {
                            items: data.items?.length || 0,
                            timestamp: data.timestamp
                        });
                        // Remove IndexedDB metadata before returning
                        delete data.id;
                        delete data.lastModified;
                        resolve(data);
                    } else {
                        console.log('ℹ️ No data found in IndexedDB');
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    console.error('❌ Failed to load from IndexedDB:', request.error);
                    reject(request.error);
                };

            } catch (error) {
                console.error('❌ IndexedDB load error:', error);
                reject(error);
            }
        });
    }

    /**
     * Clear all data from IndexedDB
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('✅ Cleared IndexedDB');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('❌ Failed to clear IndexedDB:', request.error);
                    reject(request.error);
                };

            } catch (error) {
                console.error('❌ IndexedDB clear error:', error);
                reject(error);
            }
        });
    }

    /**
     * Get storage quota information
     * @returns {Promise<Object>} Quota info
     */
    async getQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                const used = estimate.usage || 0;
                const quota = estimate.quota || 0;
                const percent = quota > 0 ? (used / quota) * 100 : 0;

                console.log('📊 Storage quota:', {
                    used: this.formatBytes(used),
                    quota: this.formatBytes(quota),
                    percent: percent.toFixed(2) + '%'
                });

                return {
                    used,
                    quota,
                    percent,
                    available: quota - used
                };
            } catch (error) {
                console.error('❌ Failed to get storage quota:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Check if IndexedDB is available
     * @returns {boolean}
     */
    isAvailable() {
        return !!window.indexedDB;
    }

    /**
     * Format bytes to human-readable string
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
     * Migrate data from localStorage to IndexedDB
     * @param {Object} localStorageData - Data from localStorage
     * @returns {Promise<boolean>} Success status
     */
    async migrateFromLocalStorage(localStorageData) {
        try {
            console.log('🔄 Migrating from localStorage to IndexedDB...');
            
            if (!localStorageData) {
                console.log('ℹ️ No data to migrate');
                return false;
            }

            await this.save(localStorageData);
            console.log('✅ Migration complete');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }

    /**
     * Get database size
     * @returns {Promise<number>} Size in bytes
     */
    async getSize() {
        try {
            const data = await this.load();
            if (!data) return 0;
            
            const size = new Blob([JSON.stringify(data)]).size;
            return size;
        } catch (error) {
            console.error('❌ Failed to get database size:', error);
            return 0;
        }
    }
}

export default IndexedDBManager;
