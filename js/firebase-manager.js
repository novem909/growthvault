/**
 * GrowthVault - Firebase Manager
 * Handles Firebase authentication and cloud sync
 */

import { CONFIG } from './config.js';

export class FirebaseManager {
    constructor(stateManager, listManager) {
        this.stateManager = stateManager;
        this.listManager = listManager;
        
        this.auth = null;
        this.database = null;
        this.currentUser = null;
        this.firebaseListener = null;
        
        this.initFirebase();
        
        console.log('🔥 FirebaseManager initialized');
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
                // Sign out
                await this.auth.signOut();
                
                // Clear local data on explicit sign out
                this.stateManager.setState({
                    items: [],
                    itemCounter: 1,
                    authorOrder: [],
                    undoStack: [],
                    authorTitles: {}
                });
                this.listManager.storageManager.clear();
                
                if (typeof showToast === 'function') {
                    showToast('Signed out', 'default');
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
            
            // Disconnect Firebase listener
            this.disconnectFirebase();
            
            // Hide sync status
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.style.display = 'none';
            }
        }
    }

    /**
     * Save data to Firebase
     * @param {Object} data - Data to save
     */
    async saveToFirebase(data) {
        if (!this.currentUser || !this.database) {
            return;
        }

        try {
            this.updateSyncStatus('syncing');
            
            const userId = this.currentUser.uid;
            await this.database.ref(`users/${userId}/data`).set(data);
            
            this.updateSyncStatus('synced');
            console.log('☁️  Saved to Firebase');
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
            return;
        }

        try {
            this.updateSyncStatus('syncing');
            
            const userId = this.currentUser.uid;
            const snapshot = await this.database.ref(`users/${userId}/data`).once('value');
            const data = snapshot.val();

            if (data) {
                // Check timestamps to resolve conflicts
                const state = this.stateManager.getState();
                const localTimestamp = state.lastSaveTimestamp || 0;
                const remoteTimestamp = data.timestamp ? new Date(data.timestamp).getTime() : 0;

                if (remoteTimestamp > localTimestamp) {
                    // Remote is newer
                    this.stateManager.loadState(data);
                    this.listManager.save(true);
                    console.log('☁️  Loaded newer data from Firebase');
                } else if (localTimestamp > remoteTimestamp) {
                    // Local is newer, push to Firebase
                    console.log('☁️  Local data is newer, syncing to Firebase...');
                    const localState = this.stateManager.getStateForSaving();
                    await this.saveToFirebase(localState);
                } else {
                     console.log('☁️  Data is up to date');
                }
                
                this.updateSyncStatus('synced');
            } else {
                // No data in Firebase, upload local data
                const state = this.stateManager.getStateForSaving();
                await this.saveToFirebase(state);
            }
        } catch (error) {
            console.error('❌ Firebase load failed:', error);
            this.updateSyncStatus('error');
            
            // Fall back to localStorage
            this.listManager.load();
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
        
        this.firebaseListener = this.database.ref(`users/${userId}/data`).on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data && data.timestamp) {
                const state = this.stateManager.getState();
                const localTimestamp = state.lastSaveTimestamp || 0;
                const remoteTimestamp = new Date(data.timestamp).getTime();

                // Only update if remote is strictly newer
                // This prevents a loop where saving updates timestamp, triggering listener, which saves again
                // Also ensures we don't overwrite newer local changes if sync was delayed
                if (remoteTimestamp > localTimestamp) {
                    console.log('☁️  Remote data newer, updating...');
                    this.stateManager.loadState(data);
                    // Update local storage but skip Firebase sync to prevent loop
                    this.listManager.save(true); 
                } else {
                    // Debug log to trace potential sync issues
                    console.log('☁️  Remote data received but not newer. Local:', localTimestamp, 'Remote:', remoteTimestamp);
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
                syncText.textContent = 'Synced';
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
            await this.saveToFirebase(state);
        }
    }
}

export default FirebaseManager;

