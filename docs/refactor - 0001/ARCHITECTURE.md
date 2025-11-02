# GrowthVault Architecture

**Version**: 2.0 (Modular)  
**Last Updated**: November 2, 2025  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Module Interactions](#module-interactions)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Event System](#event-system)
8. [Storage Strategy](#storage-strategy)
9. [File Structure](#file-structure)
10. [Dependency Graph](#dependency-graph)

---

## Overview

GrowthVault is a visual list builder application that has been refactored from a 3,248-line monolithic file into a modular, maintainable architecture with clear separation of concerns.

### Key Statistics
- **HTML**: 150 lines (index.html)
- **CSS**: 1,465 lines across 6 modular files
- **JavaScript**: ~2,000 lines across 11 modular files
- **Total LOC**: ~3,615 lines (vs. 3,248 in monolith)
- **Modules**: 9 manager classes + 2 utility files

### Technology Stack
- **ES6 Modules**: Native browser module system
- **Observer Pattern**: Reactive state management
- **Event Delegation**: Single-listener architecture
- **localStorage**: Client-side persistence
- **Firebase**: Optional cloud sync and authentication

---

## Architecture Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility:
- **State** is separate from **UI**
- **Storage** is abstracted from **Business Logic**
- **Events** are separate from **Handlers**

### 2. Dependency Injection
Managers receive their dependencies via constructor:
```javascript
constructor(stateManager, storageManager) {
  this.stateManager = stateManager;
  this.storageManager = storageManager;
}
```

### 3. Observer Pattern
State changes trigger notifications to registered observers:
```javascript
stateManager.subscribe((state) => {
  uiManager.render(state);
  firebaseManager.sync(state);
});
```

### 4. Event Delegation
Single event listener delegates to handlers based on `data-action` attributes:
```html
<button data-action="delete-item" data-item-id="123">Delete</button>
```

### 5. Immutability (Partial)
State updates create new state objects rather than mutating existing ones:
```javascript
this.state = { ...this.state, items: newItems };
```

---

## System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.html                               │
│  (HTML structure, data-action attributes, no inline JS/CSS)     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐               ┌──────────────┐
│  CSS Modules  │               │   main.js    │
│  (variables,  │               │ (Bootstrap)  │
│   base,       │               └──────┬───────┘
│   layout,     │                      │
│   components, │                      │
│   animations, │        ┌─────────────┼─────────────┐
│   responsive) │        │             │             │
└───────────────┘        ▼             ▼             ▼
              ┌──────────────┐  ┌─────────┐  ┌──────────────┐
              │    CONFIG    │  │ UI-UTILS│  │FIREBASE-CONFIG│
              │  (Constants) │  │(Helpers)│  │ (Credentials)│
              └──────────────┘  └─────────┘  └──────────────┘
                        │
        ┌───────────────┴────────────────┐
        │        CORE MANAGERS           │
        │                                │
        ├─────────┬──────────┬───────────┤
        ▼         ▼          ▼           ▼
   ┌─────────┐┌──────┐┌────────┐┌──────────┐
   │  STATE  ││STORAGE││VALIDATOR││FIREBASE  │
   │MANAGER  ││MANAGER││         ││MANAGER   │
   └────┬────┘└───┬──┘└────┬───┘└─────┬────┘
        │         │         │          │
        └─────────┼─────────┼──────────┘
                  ▼         ▼
            ┌───────────────────┐
            │   LIST MANAGER    │
            │ (Business Logic)  │
            └────────┬──────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼             ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐
   │   UI   │  │  MODAL  │  │  EVENT   │
   │MANAGER │  │ MANAGER │  │ HANDLERS │
   └───┬────┘  └────┬────┘  └─────┬────┘
       │            │             │
       └────────────┴─────────────┘
                    │
                    ▼
              ┌──────────┐
              │   DOM    │
              │(User sees)│
              └──────────┘
```

---

## Module Interactions

### Core Flow: User Action → UI Update

```
1. USER CLICKS BUTTON
   └→ Event captured by EventHandlers (delegation)

2. EVENT HANDLERS
   └→ Calls appropriate ListManager method

3. LIST MANAGER
   ├→ Validates input (Validators)
   ├→ Updates StateManager
   └→ Saves to StorageManager

4. STATE MANAGER
   └→ Notifies observers (UIManager, FirebaseManager)

5. UI MANAGER
   └→ Re-renders affected DOM elements

6. FIREBASE MANAGER (if authenticated)
   └→ Syncs state to cloud
```

### Module Dependencies

```
main.js
├── config.js
├── ui-utils.js
├── firebase-config.js
├── validators.js
├── storage-manager.js
├── state-manager.js
│   └── (no dependencies)
├── firebase-manager.js
│   ├── state-manager.js
│   └── firebase-config.js
├── list-manager.js
│   ├── state-manager.js
│   ├── storage-manager.js
│   └── validators.js
├── ui-manager.js
│   ├── state-manager.js
│   ├── list-manager.js
│   └── config.js
├── modal-manager.js
│   ├── state-manager.js
│   └── list-manager.js
└── event-handlers.js
    ├── list-manager.js
    ├── ui-manager.js
    ├── modal-manager.js
    └── firebase-manager.js
```

---

## Data Flow

### 1. Application Initialization

```
main.js loads
    │
    ├─→ Initialize CONFIG
    ├─→ Initialize UI-UTILS (theme, listeners)
    │
    ├─→ Create StateManager
    ├─→ Create StorageManager
    ├─→ Create Validators
    │
    ├─→ Create FirebaseManager(stateManager)
    ├─→ Create ListManager(stateManager, storageManager)
    ├─→ Create UIManager(stateManager, listManager)
    ├─→ Create ModalManager(stateManager, listManager)
    ├─→ Create EventHandlers(listManager, uiManager, modalManager, firebaseManager)
    │
    ├─→ EventHandlers.init() - Register event listeners
    │
    ├─→ ListManager.loadFromStorage() - Restore data
    │       │
    │       └─→ StateManager.setState(items)
    │               │
    │               └─→ Notify observers
    │                       │
    │                       ├─→ UIManager.render()
    │                       └─→ FirebaseManager.sync()
    │
    └─→ Global functions for backward compatibility
```

### 2. Adding an Item

```
User fills form & clicks "Add Item"
    │
    ├─→ EventHandlers.handleFormSubmit()
    │       │
    │       ├─→ Collects form data
    │       │
    │       └─→ ListManager.addItem(itemData)
    │               │
    │               ├─→ Validators.validateAuthor(author)
    │               ├─→ Validators.validateImage(imageFile)
    │               │
    │               ├─→ StateManager.setState({ items: [...items, newItem] })
    │               │       │
    │               │       └─→ Notify observers
    │               │               │
    │               │               ├─→ UIManager.render() → DOM updates
    │               │               └─→ FirebaseManager.sync() → Cloud upload
    │               │
    │               └─→ StorageManager.save(state)
    │
    └─→ UIManager.clearForm()
```

### 3. Deleting an Item

```
User clicks delete button
    │
    ├─→ EventHandlers (delegation catches data-action="delete-item")
    │       │
    │       └─→ EventHandlers.handleDeleteItem(itemId)
    │               │
    │               └─→ ListManager.deleteItem(itemId)
    │                       │
    │                       ├─→ Save to undo stack
    │                       │
    │                       ├─→ StateManager.setState({ items: filtered })
    │                       │       │
    │                       │       └─→ Notify observers
    │                       │               │
    │                       │               ├─→ UIManager.render()
    │                       │               └─→ FirebaseManager.sync()
    │                       │
    │                       └─→ StorageManager.save(state)
```

### 4. Undo Operation

```
User presses Ctrl+Z
    │
    ├─→ EventHandlers (keyboard listener)
    │       │
    │       └─→ EventHandlers.handleUndo()
    │               │
    │               └─→ ListManager.undo()
    │                       │
    │                       ├─→ Pop from undo stack
    │                       │
    │                       ├─→ StateManager.setState(previousState)
    │                       │       │
    │                       │       └─→ Notify observers
    │                       │               │
    │                       │               ├─→ UIManager.render()
    │                       │               └─→ FirebaseManager.sync()
    │                       │
    │                       └─→ StorageManager.save(state)
```

---

## State Management

### State Structure

```javascript
{
  items: [
    {
      id: 1730000000000,         // Timestamp
      author: "John Doe",
      title: "Article Title",
      text: "Content here...",
      image: "data:image/jpeg;base64,...",  // Optional
      date: "Oct 27, 2025 2:30 PM"
    }
  ],
  mainTitle: "Visual List Builder",
  subtitle: "Create beautiful visual lists...",
  listTitle: "Your Visual List",
  authorOrder: ["John Doe", "Jane Smith", "..."]
}
```

### State Transitions

All state updates go through `StateManager.setState()`:

```javascript
// ❌ BAD: Direct mutation
state.items.push(newItem);

// ✅ GOOD: Immutable update
stateManager.setState({
  items: [...state.items, newItem]
});
```

### Observer Pattern Implementation

```javascript
class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.observers = [];
  }

  subscribe(callback) {
    this.observers.push(callback);
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifyObservers();
  }

  notifyObservers() {
    this.observers.forEach(callback => callback(this.state));
  }
}
```

---

## Event System

### Event Delegation Architecture

Instead of attaching event listeners to individual elements, we use a **single delegated listener** on the document:

```javascript
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  
  switch(action) {
    case 'delete-item':
      handleDeleteItem(target.dataset.itemId);
      break;
    // ... more actions
  }
});
```

### Supported Actions

| Action | Element | Purpose |
|--------|---------|---------|
| `auth` | Button | Trigger Firebase authentication |
| `toggle-theme` | Button | Switch dark/light mode |
| `make-editable` | Header | Enable inline editing |
| `export-data` | Button | Download JSON backup |
| `import-data` | Input | Upload JSON file |
| `clear-all` | Button | Delete all data |
| `delete-modal-item` | Button | Delete from content modal |
| `close-modal` | Button | Close content modal |
| `format-text` | Button | Rich text formatting |
| `delete-author-from-popup` | Button | Delete all by author |
| `close-popup` | Button | Close author popup |
| `close-image-zoom` | Overlay | Close zoomed image |
| `prevent-close` | Image | Stop propagation |
| `scroll-to-form` | FAB | Scroll to input form |
| `delete-author` | Button | Delete author from list |
| `open-author-popup` | Box | Open author's items |
| `delete-item` | Button | Delete single item |
| `open-item-modal` | Text | View item details |
| `zoom-image` | Image | Open image zoom |
| `delete-item-from-popup` | Button | Delete from popup |
| `open-item-modal-from-popup` | Text | Open modal from popup |

### Benefits of Event Delegation
1. **Performance**: Single listener vs. hundreds
2. **Dynamic content**: Works with elements added after page load
3. **Memory efficiency**: Fewer event listeners
4. **Maintainability**: Centralized event logic

---

## Storage Strategy

### Three-Tier Storage

```
┌─────────────────────────────────────────┐
│         1. IN-MEMORY STATE              │
│  (stateManager.state - current session) │
└──────────────┬──────────────────────────┘
               │
               ├─→ On every change
               │
┌──────────────▼──────────────────────────┐
│       2. LOCALSTORAGE (Client)          │
│  (Persistent, survives page reload)     │
└──────────────┬──────────────────────────┘
               │
               ├─→ On state change (if authenticated)
               │
┌──────────────▼──────────────────────────┐
│  3. FIREBASE REALTIME DB (Cloud)        │
│  (Synced across devices, real-time)     │
└─────────────────────────────────────────┘
```

### localStorage Keys

| Key | Content |
|-----|---------|
| `visualListItems` | Array of all items |
| `visualListMainTitle` | Main page title |
| `visualListSubtitle` | Subtitle text |
| `visualListTitle` | List section title |
| `visualListAuthorOrder` | Custom author ordering |
| `theme` | Current theme (light/dark) |

### Data Persistence Flow

```javascript
// Save flow
ListManager.addItem()
    └─→ StateManager.setState()
        └─→ StorageManager.saveToStorage()
            ├─→ localStorage.setItem('visualListItems', JSON.stringify(items))
            └─→ (returns success/failure)

// Load flow
ListManager.loadFromStorage()
    └─→ StorageManager.loadFromStorage()
        ├─→ localStorage.getItem('visualListItems')
        ├─→ JSON.parse(data)
        └─→ StateManager.setState(data)
```

---

## File Structure

### Directory Layout

```
growthvault-html/
├── index.html                  # Entry point (150 lines)
├── README.md                   # User documentation
├── manifest.json               # PWA configuration
│
├── css/                        # Stylesheets (1,465 lines total)
│   ├── variables.css          # CSS custom properties (colors, spacing)
│   ├── base.css               # Resets, typography, global styles
│   ├── layout.css             # Container, grid, layout
│   ├── components.css         # Buttons, cards, modals
│   ├── animations.css         # Keyframes, transitions
│   └── responsive.css         # Media queries (mobile/tablet/desktop)
│
├── js/                         # JavaScript modules (~2,000 lines total)
│   ├── main.js                # Bootstrap & initialization (150 lines)
│   ├── config.js              # Constants & configuration (50 lines)
│   ├── validators.js          # Input validation (80 lines)
│   ├── storage-manager.js     # localStorage abstraction (100 lines)
│   ├── state-manager.js       # Observer pattern (120 lines)
│   ├── list-manager.js        # Business logic (425 lines)
│   ├── ui-manager.js          # DOM rendering (350 lines)
│   ├── modal-manager.js       # Modals & popups (450 lines)
│   ├── event-handlers.js      # Event delegation (475 lines)
│   ├── firebase-manager.js    # Cloud sync (200 lines)
│   ├── ui-utils.js            # Utility functions (230 lines)
│   └── firebase-config.js     # Firebase credentials (20 lines)
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── API.md                 # Module APIs (to be created)
│   ├── COMPONENTS.md          # UI components (to be created)
│   ├── DEVELOPMENT.md         # Dev setup (to be created)
│   ├── REFACTORING-PLAN.md    # Original plan
│   ├── PHASE0-FINDINGS.md     # Phase 0 summary
│   ├── PHASE1-VERIFICATION.md # Phase 1 summary
│   ├── PHASE-2-COMPLETE.md    # Phase 2 summary
│   ├── PHASE3-TESTING.md      # Testing checklist
│   ├── PHASE4-COMPLETE.md     # Phase 4 summary
│   └── PHASE5-TESTING-PLAN.md # Comprehensive test plan
│
└── archive/                    # Legacy code
    ├── README.md              # Archive explanation
    └── growthvault.html       # Original monolith (3,248 lines)
```

---

## Dependency Graph

### Import Chain

```
index.html
  │
  ├─→ css/variables.css
  ├─→ css/base.css
  ├─→ css/layout.css
  ├─→ css/components.css
  ├─→ css/animations.css
  ├─→ css/responsive.css
  │
  ├─→ Firebase SDK (CDN)
  ├─→ js/firebase-config.js (non-module)
  ├─→ js/ui-utils.js (non-module)
  │
  └─→ js/main.js (ES6 module)
        │
        ├─→ js/config.js
        ├─→ js/validators.js
        ├─→ js/storage-manager.js
        ├─→ js/state-manager.js
        │     └─→ (no imports)
        ├─→ js/firebase-manager.js
        │     ├─→ js/state-manager.js
        │     └─→ (uses global firebase from CDN)
        ├─→ js/list-manager.js
        │     ├─→ js/config.js
        │     ├─→ js/state-manager.js
        │     ├─→ js/storage-manager.js
        │     └─→ js/validators.js
        ├─→ js/ui-manager.js
        │     ├─→ js/config.js
        │     └─→ (uses global UI utils)
        ├─→ js/modal-manager.js
        │     ├─→ js/config.js
        │     └─→ (uses global UI utils)
        └─→ js/event-handlers.js
              └─→ (uses global UI utils)
```

### Circular Dependency Prevention

The architecture carefully avoids circular dependencies:

- **StateManager** has no dependencies (base of the tree)
- **StorageManager** has no dependencies (pure utility)
- **Validators** have no dependencies (pure functions)
- **ListManager** depends on StateManager but not UIManager
- **UIManager** depends on ListManager but not EventHandlers
- **EventHandlers** is the top of the tree (depends on most others)

---

## Performance Considerations

### 1. Event Delegation
Single listener on document vs. hundreds of individual listeners.

### 2. Lazy Rendering
Only render visible content; modals/popups render on-demand.

### 3. Debounced Storage
Storage writes are immediate (no debounce) to prevent data loss, but Firebase sync can be debounced.

### 4. ES6 Modules
Native browser modules (no bundler) means:
- ✅ No build step required
- ✅ Browser caching per module
- ❌ More HTTP requests (mitigated by HTTP/2)
- ❌ Requires local server for development

### 5. Image Storage
Images stored as base64 in localStorage:
- ✅ Self-contained (no external image hosting)
- ✅ Works offline
- ❌ Limited by localStorage quota (~5-10MB)
- ❌ Increases data size by ~33%

---

## Security Considerations

### 1. Input Sanitization
- Author names: trimmed, max length enforced
- Text content: preserves formatting but no script execution
- Images: validated file type and size

### 2. localStorage
- Data stored in plain text (not encrypted)
- Accessible to JavaScript on same origin
- Cleared when user clears browser data

### 3. Firebase
- Authentication required for cloud sync
- Database rules enforce user-specific data access
- API keys in firebase-config.js (public for client-side)

### 4. XSS Prevention
- No `eval()` or `Function()` constructors
- No `innerHTML` with user content (uses `textContent` or `createElement`)
- No inline event handlers (all use delegation)

---

## Future Enhancements

### 1. Build System (Optional)
- Vite or Parcel for bundling
- Minification and tree-shaking
- TypeScript migration

### 2. Testing
- Unit tests for managers (Jest/Vitest)
- Integration tests for data flow
- E2E tests (Playwright/Cypress)

### 3. Service Worker
- Offline-first with service worker
- Cache CSS/JS for instant loads
- Background sync for Firebase

### 4. Advanced Features
- Collaborative editing (operational transform)
- Rich text editor (Quill/ProseMirror)
- Markdown support
- Tag system
- Search/filter

---

## Conclusion

GrowthVault's modular architecture provides a solid foundation for future development. The clear separation of concerns, event delegation, and observer pattern make the codebase maintainable and extensible.

**Key Takeaways:**
- Managers handle specific responsibilities
- State changes flow through StateManager
- Events are delegated, not inline
- Storage is abstracted and testable
- No circular dependencies

For API documentation, see [API.md](./API.md)  
For component details, see [COMPONENTS.md](./COMPONENTS.md)  
For development setup, see [DEVELOPMENT.md](./DEVELOPMENT.md)


