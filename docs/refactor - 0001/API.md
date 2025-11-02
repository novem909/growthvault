# GrowthVault API Reference

**Version**: 2.0  
**Last Updated**: November 2, 2025

Complete API documentation for all manager modules and utilities.

---

## Table of Contents

1. [StateManager](#statemanager)
2. [StorageManager](#storagemanager)
3. [ListManager](#listmanager)
4. [UIManager](#uimanager)
5. [ModalManager](#modalmanager)
6. [EventHandlers](#eventhandlers)
7. [FirebaseManager](#firebasemanager)
8. [Validators](#validators)
9. [UI Utils](#ui-utils)
10. [Config](#config)

---

## StateManager

Manages application state with observer pattern for reactive updates.

### Constructor

```javascript
constructor()
```

Creates a new StateManager with initial state.

### Methods

#### `getState()`

Returns the current state object.

```javascript
const state = stateManager.getState();
// Returns: { items: [], mainTitle: "...", ... }
```

#### `setState(updates)`

Updates state and notifies all observers.

```javascript
stateManager.setState({ 
  items: [...state.items, newItem] 
});
```

**Parameters:**
- `updates` (Object): Partial state to merge with current state

**Returns:** void

#### `subscribe(callback)`

Registers an observer to be notified on state changes.

```javascript
stateManager.subscribe((state) => {
  console.log('State changed:', state);
});
```

**Parameters:**
- `callback` (Function): Function to call with new state

**Returns:** void

#### `notifyObservers()`

Manually trigger all observers (rarely needed, `setState` calls this automatically).

```javascript
stateManager.notifyObservers();
```

**Returns:** void

#### `getInitialState()`

Returns the default initial state structure.

```javascript
const initialState = stateManager.getInitialState();
```

**Returns:** Object with default values

---

## StorageManager

Handles localStorage persistence with error handling.

### Constructor

```javascript
constructor()
```

Creates a new StorageManager.

### Methods

#### `saveToStorage(items, config)`

Saves data to localStorage.

```javascript
storageManager.saveToStorage(items, {
  mainTitle: "My Title",
  subtitle: "Subtitle",
  listTitle: "List",
  authorOrder: ["Author1", "Author2"]
});
```

**Parameters:**
- `items` (Array): Array of item objects
- `config` (Object): Additional configuration to save

**Returns:** `{ success: boolean, error?: string }`

#### `loadFromStorage()`

Loads data from localStorage.

```javascript
const data = storageManager.loadFromStorage();
if (data.success) {
  console.log('Loaded:', data.items);
}
```

**Returns:** 
```javascript
{
  success: boolean,
  items: Array,
  config: Object,
  error?: string
}
```

#### `clearStorage()`

Clears all app data from localStorage.

```javascript
storageManager.clearStorage();
```

**Returns:** `{ success: boolean }`

#### `getStorageSize()`

Gets current localStorage usage information.

```javascript
const size = storageManager.getStorageSize();
console.log(size.formattedSize); // "2.5 KB"
```

**Returns:**
```javascript
{
  bytes: number,
  formattedSize: string,
  percentage: number
}
```

---

## ListManager

Business logic for managing items, authors, undo/redo, and data operations.

### Constructor

```javascript
constructor(stateManager, storageManager)
```

**Parameters:**
- `stateManager` (StateManager): State management instance
- `storageManager` (StorageManager): Storage instance

### Methods

#### `addItem(itemData)`

Adds a new item to the list.

```javascript
const result = await listManager.addItem({
  author: "John Doe",
  title: "Article Title",
  text: "Content here...",
  imageFile: fileObject  // optional
});
```

**Parameters:**
```javascript
{
  author: string,        // Required
  title: string,         // Optional
  text: string,          // Required
  imageFile: File        // Optional
}
```

**Returns:** `Promise<{ success: boolean, error?: string }>`

#### `deleteItem(itemId)`

Deletes an item and saves to undo stack.

```javascript
const result = listManager.deleteItem(1730000000000);
```

**Parameters:**
- `itemId` (number): Item ID (timestamp)

**Returns:** `{ success: boolean, error?: string }`

#### `deleteAuthor(author)`

Deletes all items by a specific author.

```javascript
const result = listManager.deleteAuthor("John Doe");
// Returns: { success: true, count: 5 }
```

**Parameters:**
- `author` (string): Author name

**Returns:** `{ success: boolean, count: number, error?: string }`

#### `undo()`

Undoes the last delete operation.

```javascript
const result = listManager.undo();
if (result.success) {
  console.log('Restored:', result.action, result.data);
}
```

**Returns:**
```javascript
{
  success: boolean,
  action: string,    // 'delete-item' or 'delete-author'
  data: Object,      // Restored data
  error?: string
}
```

#### `groupItemsByAuthor()`

Groups items by author name.

```javascript
const grouped = listManager.groupItemsByAuthor();
// Returns: Map { "John" => [item1, item2], "Jane" => [item3] }
```

**Returns:** `Map<string, Array>`

#### `getOrderedAuthors()`

Gets authors in custom order (or alphabetical).

```javascript
const authors = listManager.getOrderedAuthors();
// Returns: ["John Doe", "Jane Smith", ...]
```

**Returns:** `Array<string>`

#### `updateAuthorOrder(authors)`

Updates custom author ordering.

```javascript
listManager.updateAuthorOrder(["Jane", "John", "Bob"]);
```

**Parameters:**
- `authors` (Array<string>): Ordered array of author names

**Returns:** `{ success: boolean }`

#### `exportData()`

Exports all data as JSON file download.

```javascript
listManager.exportData();
// Downloads: growthvault-backup-YYYYMMDD-HHMMSS.json
```

**Returns:** void

#### `importData(file)`

Imports data from JSON file.

```javascript
const result = await listManager.importData(fileObject);
if (result.success) {
  console.log('Imported:', result.itemCount, 'items');
}
```

**Parameters:**
- `file` (File): JSON file object

**Returns:** `Promise<{ success: boolean, itemCount: number, error?: string }>`

#### `clearAllData()`

Clears all application data.

```javascript
const result = listManager.clearAllData();
```

**Returns:** `{ success: boolean }`

#### `loadFromStorage()`

Loads data from storage on app start.

```javascript
listManager.loadFromStorage();
```

**Returns:** void

#### `saveToStorage()`

Manually triggers save to storage.

```javascript
listManager.saveToStorage();
```

**Returns:** void

---

## UIManager

Manages DOM rendering and visual updates.

### Constructor

```javascript
constructor(stateManager, listManager)
```

**Parameters:**
- `stateManager` (StateManager): State management instance
- `listManager` (ListManager): List manager instance

### Methods

#### `render()`

Renders the entire visual list.

```javascript
uiManager.render();
```

**Returns:** void

#### `renderAuthorBox(author, items)`

Renders a single author box with items.

```javascript
const html = uiManager.renderAuthorBox("John Doe", [item1, item2]);
```

**Parameters:**
- `author` (string): Author name
- `items` (Array): Array of items by this author

**Returns:** `string` (HTML)

#### `renderEmptyState()`

Renders the empty state message.

```javascript
uiManager.renderEmptyState();
```

**Returns:** void

#### `clearForm()`

Clears all form inputs.

```javascript
uiManager.clearForm();
```

**Returns:** void

#### `updateStorageInfo()`

Updates the storage indicator with current size.

```javascript
uiManager.updateStorageInfo();
```

**Returns:** void

#### `showUndoNotification(action, data)`

Displays undo notification toast.

```javascript
uiManager.showUndoNotification('delete-item', { title: "Article" });
```

**Parameters:**
- `action` (string): Action type ('delete-item' or 'delete-author')
- `data` (Object): Data that was restored

**Returns:** void

#### `addDragAndDrop()`

Attaches drag-and-drop handlers to author boxes.

```javascript
uiManager.addDragAndDrop();
```

**Returns:** void

---

## ModalManager

Manages content modals and author popups.

### Constructor

```javascript
constructor(stateManager, listManager)
```

**Parameters:**
- `stateManager` (StateManager): State management instance
- `listManager` (ListManager): List manager instance

### Properties

- `currentItemId` (number|null): ID of item in content modal
- `currentAuthor` (string|null): Author name in popup

### Methods

#### `openContentModal(itemId)`

Opens content modal for specific item.

```javascript
modalManager.openContentModal(1730000000000);
```

**Parameters:**
- `itemId` (number): Item ID

**Returns:** void

#### `closeContentModal()`

Closes the content modal.

```javascript
modalManager.closeContentModal();
```

**Returns:** void

#### `openAuthorPopup(author)`

Opens author popup with all items by that author.

```javascript
modalManager.openAuthorPopup("John Doe");
```

**Parameters:**
- `author` (string): Author name

**Returns:** void

#### `closeAuthorPopup()`

Closes the author popup.

```javascript
modalManager.closeAuthorPopup();
```

**Returns:** void

#### `renderAuthorPopupItem(item, container, author)`

Renders a single item in the author popup.

```javascript
modalManager.renderAuthorPopupItem(item, containerElement, "John");
```

**Parameters:**
- `item` (Object): Item to render
- `container` (HTMLElement): Container element
- `author` (string): Author name

**Returns:** void

#### `addPopupDragAndDrop()`

Adds drag-and-drop to items in author popup.

```javascript
modalManager.addPopupDragAndDrop();
```

**Returns:** void

#### `updateAuthorItemsFromDOM()`

Updates state from DOM after drag reordering.

```javascript
modalManager.updateAuthorItemsFromDOM();
```

**Returns:** void

---

## EventHandlers

Central event delegation system.

### Constructor

```javascript
constructor(managers)
```

**Parameters:**
```javascript
{
  listManager: ListManager,
  uiManager: UIManager,
  modalManager: ModalManager,
  firebaseManager: FirebaseManager
}
```

### Methods

#### `init()`

Initializes all event listeners.

```javascript
eventHandlers.init();
```

**Returns:** void

#### `setupFormHandler()`

Sets up form submission handler.

**Returns:** void (internal)

#### `setupClickDelegation()`

Sets up document-level click delegation.

**Returns:** void (internal)

#### `setupChangeHandlers()`

Sets up change event handlers (e.g., file inputs).

**Returns:** void (internal)

#### `setupModalHandlers()`

Sets up modal backdrop click handlers.

**Returns:** void (internal)

#### `setupKeyboardShortcuts()`

Sets up keyboard shortcuts (ESC, Ctrl+Z).

**Returns:** void (internal)

#### `handleFormSubmit()`

Handles form submission.

**Returns:** `Promise<void>` (internal)

#### `handleDeleteItem(itemId)`

Handles item deletion.

**Parameters:**
- `itemId` (number): Item ID

**Returns:** void (internal)

#### `handleDeleteAuthor(author)`

Handles author deletion.

**Parameters:**
- `author` (string): Author name

**Returns:** void (internal)

#### `handleAuth()`

Handles authentication.

**Returns:** `Promise<void>` (internal)

---

## FirebaseManager

Handles Firebase authentication and real-time database sync.

### Constructor

```javascript
constructor(stateManager)
```

**Parameters:**
- `stateManager` (StateManager): State management instance

### Properties

- `isAuthenticated` (boolean): Whether user is signed in
- `currentUser` (Object|null): Current Firebase user

### Methods

#### `initialize()`

Initializes Firebase connection.

```javascript
firebaseManager.initialize();
```

**Returns:** void

#### `handleAuth()`

Toggles sign in/out.

```javascript
await firebaseManager.handleAuth();
```

**Returns:** `Promise<void>`

#### `signIn()`

Signs in with Firebase.

```javascript
await firebaseManager.signIn();
```

**Returns:** `Promise<{ success: boolean, error?: string }>`

#### `signOut()`

Signs out from Firebase.

```javascript
await firebaseManager.signOut();
```

**Returns:** `Promise<{ success: boolean, error?: string }>`

#### `syncToFirebase(state)`

Syncs current state to Firebase.

```javascript
firebaseManager.syncToFirebase(state);
```

**Parameters:**
- `state` (Object): State to sync

**Returns:** `Promise<void>`

#### `loadFromFirebase()`

Loads data from Firebase.

```javascript
await firebaseManager.loadFromFirebase();
```

**Returns:** `Promise<void>`

---

## Validators

Pure validation functions.

### Functions

#### `validateAuthor(author)`

Validates author name.

```javascript
const result = validateAuthor("John Doe");
// Returns: { valid: true }
```

**Parameters:**
- `author` (string): Author name

**Returns:** `{ valid: boolean, error?: string }`

**Rules:**
- Not empty
- Max length: 100 characters

#### `validateText(text)`

Validates text content.

```javascript
const result = validateText("Content here");
// Returns: { valid: true }
```

**Parameters:**
- `text` (string): Text content

**Returns:** `{ valid: boolean, error?: string }`

**Rules:**
- Not empty (unless optional)
- Max length: 50,000 characters

#### `validateImage(file)`

Validates image file.

```javascript
const result = await validateImage(fileObject);
// Returns: { valid: true, dataUrl: "data:image/jpeg;base64,..." }
```

**Parameters:**
- `file` (File): Image file object

**Returns:** `Promise<{ valid: boolean, dataUrl?: string, error?: string }>`

**Rules:**
- Type: image/*
- Max size: 5MB
- Converts to base64 data URL

---

## UI Utils

Global utility functions (non-module).

### Functions

#### `showToast(message, type)`

Displays a toast notification.

```javascript
showToast('Item added!', 'success');
showToast('Error occurred', 'error');
showToast('Info message', 'default');
```

**Parameters:**
- `message` (string): Message to display
- `type` (string): 'success' | 'error' | 'default'

**Returns:** void

#### `toggleDarkMode()`

Toggles between light and dark theme.

```javascript
toggleDarkMode();
```

**Returns:** void

#### `initializeTheme()`

Loads theme from localStorage and applies it.

```javascript
initializeTheme();
```

**Returns:** void

#### `scrollToForm()`

Smoothly scrolls to the input form.

```javascript
scrollToForm();
```

**Returns:** void

#### `openImageZoom(imageSrc)`

Opens image in fullscreen zoom overlay.

```javascript
openImageZoom('data:image/jpeg;base64,...');
```

**Parameters:**
- `imageSrc` (string): Image source URL or data URL

**Returns:** void

#### `closeImageZoom(event)`

Closes the image zoom overlay.

```javascript
closeImageZoom(event);
```

**Parameters:**
- `event` (Event): Click or keyboard event

**Returns:** void

#### `makeEditable(element)`

Makes a header element inline-editable.

```javascript
makeEditable(headerElement);
```

**Parameters:**
- `element` (HTMLElement): Header element to make editable

**Returns:** void

#### `formatText(command)`

Executes text formatting command.

```javascript
formatText('bold');
formatText('insertUnorderedList');
```

**Parameters:**
- `command` (string): execCommand command name

**Returns:** void

#### `debounce(func, wait)`

Returns a debounced version of the function.

```javascript
const debouncedSave = debounce(() => save(), 500);
```

**Parameters:**
- `func` (Function): Function to debounce
- `wait` (number): Milliseconds to wait

**Returns:** Function

#### `showSaveIndicator()`

Shows the auto-save indicator briefly.

```javascript
showSaveIndicator();
```

**Returns:** void

---

## Config

Application constants (module export).

### Constants

```javascript
export const CONFIG = {
  STORAGE_KEYS: {
    ITEMS: 'visualListItems',
    MAIN_TITLE: 'visualListMainTitle',
    SUBTITLE: 'visualListSubtitle',
    LIST_TITLE: 'visualListTitle',
    AUTHOR_ORDER: 'visualListAuthorOrder'
  },
  
  LIMITS: {
    MAX_AUTHOR_LENGTH: 100,
    MAX_TEXT_LENGTH: 50000,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
    UNDO_STACK_SIZE: 1
  },
  
  SELECTORS: {
    VISUAL_LIST: '#visualList',
    ITEM_FORM: '#itemForm',
    CONTENT_MODAL: '#contentModal',
    AUTHOR_POPUP: '#authorPopup'
  },
  
  VALIDATION: {
    IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    MIN_AUTHOR_LENGTH: 1,
    MIN_TEXT_LENGTH: 1
  }
};
```

---

## Usage Examples

### Complete Flow: Add Item

```javascript
// User fills form and clicks submit
// EventHandlers intercepts the submit event

async handleFormSubmit() {
  // 1. Collect form data
  const itemData = {
    author: document.getElementById('authorInput').value,
    title: document.getElementById('titleInput').value,
    text: document.getElementById('textInput').value,
    imageFile: document.getElementById('imageInput').files[0]
  };
  
  // 2. Add item (validation happens inside)
  const result = await this.listManager.addItem(itemData);
  
  // 3. Handle result
  if (result.success) {
    this.uiManager.clearForm();
    showToast('Item added!', 'success');
  } else {
    showToast(result.error, 'error');
  }
}
```

### Complete Flow: Delete with Undo

```javascript
// User clicks delete button
handleDeleteItem(itemId) {
  // 1. Delete item (automatically saves to undo stack)
  const result = this.listManager.deleteItem(itemId);
  
  if (result.success) {
    showToast('Item deleted', 'default');
  }
}

// User presses Ctrl+Z
handleUndo() {
  // 2. Undo the deletion
  const result = this.listManager.undo();
  
  if (result.success) {
    this.uiManager.showUndoNotification(result.action, result.data);
  }
}
```

### Complete Flow: State Update

```javascript
// Inside ListManager.addItem()

// 1. Get current state
const state = this.stateManager.getState();

// 2. Create new item
const newItem = {
  id: Date.now(),
  author: itemData.author,
  title: itemData.title,
  text: itemData.text,
  image: dataUrl,
  date: new Date().toLocaleString()
};

// 3. Update state (immutable)
this.stateManager.setState({
  items: [...state.items, newItem]
});

// 4. StateManager automatically notifies observers:
//    - UIManager re-renders the list
//    - FirebaseManager syncs to cloud

// 5. Save to localStorage
this.storageManager.saveToStorage(newState.items, config);
```

---

## Error Handling

All manager methods return result objects:

```javascript
// Success
{ success: true, /* ...data */ }

// Failure
{ success: false, error: "Description of error" }
```

Example error handling:

```javascript
const result = await listManager.addItem(data);

if (!result.success) {
  console.error('Failed to add item:', result.error);
  showToast(result.error, 'error');
  return;
}

// Continue with success logic
```

---

## TypeScript Definitions (Future)

For TypeScript migration, here are the suggested type definitions:

```typescript
// State
interface Item {
  id: number;
  author: string;
  title: string;
  text: string;
  image?: string;
  date: string;
}

interface State {
  items: Item[];
  mainTitle: string;
  subtitle: string;
  listTitle: string;
  authorOrder: string[];
}

// Results
interface Result {
  success: boolean;
  error?: string;
}

interface AddItemResult extends Result {
  itemId?: number;
}

interface DeleteAuthorResult extends Result {
  count?: number;
}

interface UndoResult extends Result {
  action?: string;
  data?: any;
}
```

---

## Deprecation Notice

None currently. API is stable as of v2.0.

---

## Changelog

### v2.0 (November 2, 2025)
- Complete refactor to modular architecture
- All modules now follow consistent API patterns
- Added result objects for better error handling
- Removed inline event handlers

### v1.0 (October 20, 2025)
- Original monolithic implementation

---

For architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md)  
For UI components, see [COMPONENTS.md](./COMPONENTS.md)  
For development guide, see [DEVELOPMENT.md](./DEVELOPMENT.md)


