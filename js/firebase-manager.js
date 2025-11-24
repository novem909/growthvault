/**
 * GrowthVault - Firebase Manager
 * Handles Firebase authentication and cloud sync
 */

import { CONFIG } from './config.js';

export class FirebaseManager {
    constructor(stateManager, listManager = null, uiManager = null) {
        this.stateManager = stateManager;
        this.listManager = listManager;
        this.uiManager = uiManager;
        
        this.auth = null;
        this.database = null;
        this.currentUser = null;
        this.firebaseListener = null;
        
        this.initFirebase();
        
        console.log('🔥 FirebaseManager initialized');
    }

    /**
     * Set List Manager (called after initialization to resolve circular dependency)
     * @param {ListManager} listManager
     */
    setListManager(listManager) {
        this.listManager = listManager;
    }


    /**
     * Initialize Firebase
     */
    initFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn('⚠️  Firebase SDK not loaded');
                return;
            }

            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
            }

            this.auth = firebase.auth();
            this.database = firebase.database();

            // Setup auth state observer
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });

            console.log('✅ Firebase initialized');
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
        }
    }

    /**
     * Handle authentication
     */
    async handleAuth() {
        if (!this.auth) {
            if (typeof showToast === 'function') {
                showToast('Firebase not initialized', 'error');
            }
            return;
        }

        try {
            if (this.currentUser) {
                // Sync current state to Firebase before signing out
                const state = this.stateManager.getStateForSaving();
                console.log('🔐 Signing out. Current state:', {
                    itemCount: state.items?.length || 0,
                    timestamp: state.timestamp,
                    user: this.currentUser.email
                });
                
                try {
                    await this.saveToFirebase(state);
                    console.log('✅ Data synced successfully before sign out');
                } catch (syncError) {
                    console.error('❌ Failed to sync before sign out:', syncError);
                    if (typeof showToast === 'function') {
                        showToast('Failed to sync data before signing out. Please try again.', 'error');
                    }
                    return; // Abort sign-out to prevent data loss
                }
                
                // Sign out
                await this.auth.signOut();
                // Note: Data clearing happens in handleAuthStateChange when user becomes null
                
                if (typeof showToast === 'function') {
                    showToast('Signed out. Your data is safely stored in the cloud.', 'default');
                }
            } else {
                // Sign in with Google
                const provider = new firebase.auth.GoogleAuthProvider();
                await this.auth.signInWithPopup(provider);
            }
        } catch (error) {
            console.error('❌ Auth error:', error);
            if (typeof showToast === 'function') {
                showToast('Authentication failed: ' + error.message, 'error');
            }
        }
    }

    /**
     * Handle auth state changes
     * @param {Object} user - Firebase user object
     */
    async handleAuthStateChange(user) {
        this.currentUser = user;
        this.stateManager.setState({ currentUser: user });

        this.updateAuthUI(user);

        if (user) {
            console.log('👤 User signed in:', user.email);
            
            // Load data from Firebase
            await this.loadFromFirebase();
            
            // Setup real-time listener
            this.setupFirebaseListener();
            
            if (typeof showToast === 'function') {
                showToast(`Signed in as ${user.email}`, 'success');
            }
        } else {
            console.log('👤 User signed out');
            
            // Disconnect Firebase listener FIRST to prevent any incoming data
            this.disconnectFirebase();
            
            // Clear local data so another account's data doesn't persist
            await this.clearLocalDataOnSignOut();
            
            // Hide sync status
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.style.display = 'none';
            }
        }
    }

    /**
     * Clear local data when user signs out
     * This prevents data from one account appearing for another account
     */
    async clearLocalDataOnSignOut() {
        console.log('🧹 Clearing local data after sign out...');
        
        // Reset in-memory state
        this.stateManager.reset();
        
        // Clear local storage (IndexedDB + localStorage)
        if (this.listManager && this.listManager.persistenceManager) {
            await this.listManager.persistenceManager.clear();
        }
        
        // Force UI to re-render with empty state
        if (this.uiManager) {
            this.uiManager.renderItems();
            await this.uiManager.updateStorageInfo();
        }
        
        console.log('✅ Local data cleared');
    }

    /**
     * Save data to Firebase
     * @param {Object} data - Data to save
     */
    async saveToFirebase(data) {
        if (!this.currentUser || !this.database) {
            console.warn('⚠️  Cannot save to Firebase: user or database not initialized');
            return;
        }

        try {
            this.updateSyncStatus('syncing');
            
            const userId = this.currentUser.uid;
            console.log('☁️  Saving to Firebase:', {
                userId,
                itemCount: data.items?.length || 0,
                timestamp: data.timestamp
            });
            
            await this.database.ref(`users/${userId}/data`).set(data);
            
            this.updateSyncStatus('synced');
            console.log('✅ Saved to Firebase successfully');
        } catch (error) {
            console.error('❌ Firebase save failed:', error);
            this.updateSyncStatus('error');
        }
    }

    /**
     * Load data from Firebase
     */
    async loadFromFirebase() {
        if (!this.currentUser || !this.database) {
            console.warn('⚠️  Cannot load from Firebase: user or database not initialized');
            return;
        }

        try {
            this.updateSyncStatus('syncing');
            
            const userId = this.currentUser.uid;
            console.log('☁️  Loading from Firebase for user:', userId);
            
            const snapshot = await this.database.ref(`users/${userId}/data`).once('value');
            const data = snapshot.val();

            console.log('📥 Firebase data retrieved:', {
                hasData: !!data,
                itemCount: data?.items?.length || 0,
                remoteTimestamp: data?.timestamp
            });

            if (data) {
                // Check timestamps to resolve conflicts
                const state = this.stateManager.getState();
                const localItemCount = state.items?.length || 0;
                const remoteItemCount = data.items?.length || 0;
                const localTimestamp = state.lastSaveTimestamp || 0;
                const remoteTimestamp = data.timestamp ? new Date(data.timestamp).getTime() : 0;

                console.log('⚖️  Comparing data:', {
                    localItems: localItemCount,
                    remoteItems: remoteItemCount,
                    localTimestamp: localTimestamp,
                    remoteTimestamp: remoteTimestamp,
                    localDate: localTimestamp ? new Date(localTimestamp).toISOString() : 'none',
                    remoteDate: data.timestamp || 'none'
                });

                // Special case: Don't overwrite local data with empty Firebase data
                if (remoteItemCount === 0 && localItemCount > 0) {
                    console.log('⚠️  Firebase has no items but local has data. Keeping local data and syncing to Firebase.');
                    const localState = this.stateManager.getStateForSaving();
                    await this.saveToFirebase(localState);
                } else if (remoteTimestamp > localTimestamp || (localTimestamp === 0 && remoteItemCount > 0)) {
                    // Remote is newer OR local has no timestamp but remote has data
                    console.log('☁️  Remote is newer or local has no timestamp, loading from Firebase...');
                    this.stateManager.loadState(data);
                    
                    // Save to storage with preserved Firebase timestamp
                    const saveResult = await this.listManager.save(true, { preserveTimestamp: true });
                    console.log('💾 Saved Firebase data to storage, preserving timestamp:', data.timestamp);
                    
                    // Force UI update
                    if (this.uiManager) {
                        this.uiManager.renderItems();
                        await this.uiManager.updateStorageInfo();
                        console.log('🎨 UI refreshed with Firebase data');
                    }
                    
                    console.log('✅ Loaded data from Firebase');
                } else if (localTimestamp > remoteTimestamp) {
                    // Local is newer, push to Firebase
                    console.log('📤 Local data is newer, syncing to Firebase...');
                    const localState = this.stateManager.getStateForSaving();
                    await this.saveToFirebase(localState);
                } else {
                     console.log('✅ Data is up to date');
                }
                
                this.updateSyncStatus('synced');
            } else {
                // No data in Firebase, upload local data if it's not empty
                const state = this.stateManager.getStateForSaving();
                console.log('📭 No data in Firebase. Local items:', state.items?.length || 0);
                
                if (state.items && state.items.length > 0) {
                    console.log('📤 Uploading local data to Firebase...');
                    await this.saveToFirebase(state);
                } else {
                    console.log('✅ No data in Firebase or locally');
                    this.updateSyncStatus('synced');
                }
            }
        } catch (error) {
            console.error('❌ Firebase load failed:', error);
            this.updateSyncStatus('error');
            
            // Fall back to storage (IndexedDB or localStorage)
            await this.listManager.load();
        }
    }

    /**
     * Setup Firebase real-time listener
     */
    setupFirebaseListener() {
        if (!this.currentUser || this.firebaseListener) {
            return;
        }

        const userId = this.currentUser.uid;
        
        this.firebaseListener = this.database.ref(`users/${userId}/data`).on('value', async (snapshot) => {
            const data = snapshot.val();
            
            if (data && data.timestamp) {
                const state = this.stateManager.getState();
                const localTimestamp = state.lastSaveTimestamp || 0;
                const remoteTimestamp = new Date(data.timestamp).getTime();

                console.log('🔔 Real-time listener fired. Comparing timestamps:', {
                    local: localTimestamp,
                    remote: remoteTimestamp,
                    localNewer: localTimestamp > remoteTimestamp,
                    remoteNewer: remoteTimestamp > localTimestamp
                });

                // Only update if remote is strictly newer
                // This prevents a loop where saving updates timestamp, triggering listener, which saves again
                // Also ensures we don't overwrite newer local changes if sync was delayed
                if (remoteTimestamp > localTimestamp) {
                    console.log('☁️  Remote data newer, updating...');
                    this.stateManager.loadState(data);
                    // Update local storage but skip Firebase sync to prevent loop
                    await this.listManager.save(true, { preserveTimestamp: true });
                    
                    // Force UI update
                    if (this.uiManager) {
                        this.uiManager.renderItems();
                        await this.uiManager.updateStorageInfo();
                        console.log('🎨 UI refreshed from real-time update');
                    }
                } else {
                    // Debug log to trace potential sync issues
                    console.log('⏭️  Skipping update - local data is same or newer');
                }
            }
        });

        console.log('🔄 Firebase listener active');
    }

    /**
     * Disconnect Firebase listener
     */
    disconnectFirebase() {
        if (this.firebaseListener && this.currentUser) {
            const userId = this.currentUser.uid;
            this.database.ref(`users/${userId}/data`).off('value', this.firebaseListener);
            this.firebaseListener = null;
            console.log('🔌 Firebase listener disconnected');
        }
    }

    /**
     * Update auth UI
     * @param {Object} user - Firebase user
     */
    updateAuthUI(user) {
        const authButton = document.getElementById('authButton');
        const authText = document.getElementById('authText');
        const syncStatus = document.getElementById('syncStatus');

        if (authText) {
            authText.textContent = user ? 'Sign Out' : 'Sign In';
        }

        if (syncStatus) {
            syncStatus.style.display = user ? 'block' : 'none';
        }
    }

    /**
     * Update sync status indicator
     * @param {string} status - 'syncing' | 'synced' | 'error'
     */
    updateSyncStatus(status) {
        const syncIndicator = document.getElementById('syncIndicator');
        const syncText = document.getElementById('syncText');

        if (!syncIndicator || !syncText) return;

        switch(status) {
            case 'syncing':
                syncIndicator.style.color = '#f59e0b';
                syncText.textContent = 'Syncing...';
                break;
            case 'synced':
                syncIndicator.style.color = '#10b981';
                if (this.currentUser && this.currentUser.email) {
                    syncText.textContent = this.currentUser.email;
                } else {
                    syncText.textContent = 'Synced';
                }
                break;
            case 'error':
                syncIndicator.style.color = '#ef4444';
                syncText.textContent = 'Sync error';
                break;
        }
    }

    /**
     * Sync current state to Firebase
     */
    async sync() {
        if (this.currentUser) {
            const state = this.stateManager.getStateForSaving();
            console.log('🔄 Manual sync triggered. Items:', state.items?.length || 0);
            await this.saveToFirebase(state);
        } else {
            console.log('⚠️  Sync skipped: no user logged in');
        }
    }
}

export default FirebaseManager;

