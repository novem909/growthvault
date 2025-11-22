/**
 * GrowthVault - State Manager
 * Centralized state management with observer pattern
 */

export class StateManager {
    constructor() {
        this.state = {
            items: [],
            itemCounter: 1,
            authorOrder: [],
            undoStack: [],
            currentUser: null,
            theme: 'light',
            titles: {
                mainTitle: 'Visual List Builder',
                subtitle: 'Create beautiful visual lists with text and images',
                listTitle: 'Your Visual List'
            },
            lastSaveTimestamp: 0
        };
        
        this.subscribers = new Map();
        this.isUpdating = false;
    }

    /**
     * Get current state (immutable copy)
     * @returns {Object} State object
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Get specific state property
     * @param {string} key - Property key
     * @returns {*} Property value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Update state and notify subscribers
     * @param {Object} updates - Partial state updates
     */
    setState(updates) {
        if (this.isUpdating) {
            console.warn('⚠️  Recursive setState detected, ignoring');
            return;
        }

        this.isUpdating = true;
        const oldState = this.getState();
        
        // Merge updates into state
        this.state = {
            ...this.state,
            ...updates
        };

        // Notify subscribers
        this.notifySubscribers(oldState, this.state, updates);
        
        this.isUpdating = false;
    }

    /**
     * Subscribe to state changes
     * @param {string} key - Subscription key
     * @param {Function} callback - Callback function (newState, oldState, updates)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        
        this.subscribers.get(key).push(callback);
        console.log(`📡 Subscribed to state changes: ${key}`);

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`📴 Unsubscribed from state changes: ${key}`);
            }
        };
    }

    /**
     * Notify all subscribers of state changes
     * @param {Object} oldState
     * @param {Object} newState
     * @param {Object} updates - What changed
     */
    notifySubscribers(oldState, newState, updates) {
        this.subscribers.forEach((callbacks, key) => {
            callbacks.forEach(callback => {
                try {
                    callback(newState, oldState, updates);
                } catch (error) {
                    console.error(`❌ Error in subscriber callback (${key}):`, error);
                }
            });
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            items: [],
            itemCounter: 1,
            authorOrder: [],
            undoStack: [],
            lastSaveTimestamp: 0
        });
        console.log('🔄 State reset to defaults');
    }

    /**
     * Load state from saved data
     * @param {Object} data - Saved data object
     */
    loadState(data) {
        this.setState({
            items: data.items || [],
            itemCounter: data.itemCounter || 1,
            authorOrder: data.authorOrder || [],
            undoStack: data.undoStack || [],
            titles: data.titles || this.state.titles,
            lastSaveTimestamp: data.timestamp ? new Date(data.timestamp).getTime() : 0
        });
        console.log('📥 State loaded from saved data');
    }

    /**
     * Get state object for saving
     * @returns {Object} Serializable state
     */
    getStateForSaving() {
        const data = {
            items: this.state.items,
            itemCounter: this.state.itemCounter,
            authorOrder: this.state.authorOrder,
            undoStack: this.state.undoStack,
            titles: this.state.titles
        };

        if (this.state.lastSaveTimestamp) {
            data.timestamp = new Date(this.state.lastSaveTimestamp).toISOString();
        }
        
        return data;
    }
}

export default StateManager;

