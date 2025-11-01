/**
 * GrowthVault - Application Configuration
 * Central configuration constants and settings
 */

export const CONFIG = {
    // Storage
    STORAGE_KEY: 'visualListBuilder_data',
    
    // Firebase Configuration
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyA8Kqj3h5o8DrdxwQPWL9-MjkUnHQX7dMI",
        authDomain: "growthvault-df6c5.firebaseapp.com",
        databaseURL: "https://growthvault-df6c5-default-rtdb.firebaseio.com",
        projectId: "growthvault-df6c5",
        storageBucket: "growthvault-df6c5.firebasestorage.app",
        messagingSenderId: "512937818189",
        appId: "1:512937818189:web:a848e0925383243326c404",
        measurementId: "G-8J57HZ998T"
    },
    
    // File Upload Limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // UI Settings
    DEBOUNCE_DELAY: 500,
    TOAST_DURATION: 3000,
    MAX_UNDO_HISTORY: 20,
    
    // Selectors
    SELECTORS: {
        FORM: '#itemForm',
        AUTHOR_INPUT: '#authorInput',
        TITLE_INPUT: '#titleInput',
        TEXT_INPUT: '#textInput',
        IMAGE_INPUT: '#imageInput',
        VISUAL_LIST: '#visualList',
        CONTENT_MODAL: '#contentModal',
        AUTHOR_POPUP: '#authorPopup',
        IMAGE_ZOOM_OVERLAY: '#imageZoomOverlay'
    }
};

export default CONFIG;

