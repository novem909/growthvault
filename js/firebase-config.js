/**
 * Firebase Configuration and Initialization
 */

const firebaseConfig = {
    apiKey: "AIzaSyC3-B0RlrOS3Keaa8Mvtf18Y2sxR1BPRew",
    authDomain: "growthvault-df6c5.firebaseapp.com",
    databaseURL: "https://growthvault-df6c5-default-rtdb.firebaseio.com",
    projectId: "growthvault-df6c5",
    storageBucket: "growthvault-df6c5.firebasestorage.app",
    messagingSenderId: "512937818189",
    appId: "1:512937818189:web:a848e0925383243326c404",
    measurementId: "G-8J57HZ998T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Current user state
let currentUser = null;

// Firebase authentication functions
function updateSyncStatus(status) {
    const syncStatus = document.getElementById('syncStatus');
    const syncIndicator = document.getElementById('syncIndicator');
    const syncText = document.getElementById('syncText');
    
    if (!syncStatus) return;
    
    switch(status) {
        case 'syncing':
            syncIndicator.style.color = '#f59e0b';
            syncText.textContent = 'Syncing...';
            syncStatus.style.display = 'block';
            break;
        case 'synced':
            syncIndicator.style.color = '#10b981';
            syncText.textContent = 'Synced';
            syncStatus.style.display = 'block';
            break;
        case 'error':
            syncIndicator.style.color = '#ef4444';
            syncText.textContent = 'Sync Error';
            syncStatus.style.display = 'block';
            break;
        default:
            syncStatus.style.display = 'none';
    }
}

async function handleAuth() {
    if (currentUser) {
        // Sign out
        try {
            await auth.signOut();
            currentUser = null;
            document.getElementById('authText').textContent = 'Sign In';
            updateSyncStatus('none');
            showToast('Signed out successfully', 'success');
        } catch (error) {
            console.error('Sign out error:', error);
            showToast('Failed to sign out', 'error');
        }
    } else {
        // Sign in
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Sign in error:', error);
            showToast('Failed to sign in', 'error');
        }
    }
}

// Listen to auth state changes
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const authText = document.getElementById('authText');
        if (authText) authText.textContent = 'Sign Out';
        showToast(`Signed in as ${user.displayName || user.email}`, 'success');
        // Load data from Firebase
        if (window.listBuilder) {
            await window.listBuilder.loadFromFirebase();
        }
    } else {
        currentUser = null;
        const authText = document.getElementById('authText');
        if (authText) authText.textContent = 'Sign In';
        if (window.listBuilder) {
            window.listBuilder.disconnectFirebase();
        }
    }
});

// MOCK AUTH FOR TESTING - UNCOMMENT TO ENABLE
/*
setTimeout(() => {
    const mockUser = {
        uid: 'test-user-123',
        email: 'test@local.dev',
        displayName: 'Test User'
    };
    // Trigger auth state change manually for testing
    currentUser = mockUser;
    const authText = document.getElementById('authText');
    if (authText) authText.textContent = 'Sign Out';
    updateSyncStatus('synced'); // This triggers the email display logic
    showToast('Mock login successful', 'success');
}, 2000);
*/
