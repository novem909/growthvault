# Visual List Builder

A beautiful, professional web application for creating and organizing visual lists with author-based content organization.

## Features

- 📝 **Author-based Organization**: Group content by author with visual cards
- 🎨 **Dark/Light Themes**: Toggle between visual modes
- 🔄 **Drag & Drop**: Reorder both authors and content items
- ↩️ **Undo/Redo System**: Restore deleted items and authors
- 💾 **Auto-save**: Automatic localStorage persistence
- 📤 **Export/Import**: Backup and restore your data as JSON
- ✏️ **Inline Editing**: Click to edit titles and content directly
- 🖼️ **Rich Content**: Support for formatted text and images
- ☁️ **Cloud Sync**: Firebase integration for multi-device access
- 📱 **PWA Support**: Install as a progressive web app

## Project Structure

```
growthvault-html/
├── index.html              # Main application entry point (modular)
├── growthvault.html        # Original single-file version (legacy, will be archived)
├── manifest.json           # PWA manifest
├── css/                    # Modular stylesheets (1,465 lines total)
│   ├── variables.css       # CSS custom properties and themes
│   ├── base.css            # Base styles and typography
│   ├── layout.css          # Layout and grid systems
│   ├── components.css      # UI component styles
│   ├── animations.css      # Keyframe animations
│   └── responsive.css      # Mobile responsive styles
├── js/                     # Modular JavaScript architecture
│   ├── main.js             # Application entry point and initialization
│   ├── config.js           # Application constants and configuration
│   ├── storage-manager.js  # localStorage persistence layer
│   ├── state-manager.js    # Central state management with observer pattern
│   ├── list-manager.js     # CRUD operations, undo/redo, data import/export
│   ├── ui-manager.js       # DOM rendering and template population
│   ├── modal-manager.js    # Modal and popup management
│   ├── event-handlers.js   # Event delegation and user interactions
│   ├── firebase-manager.js # Firebase auth and realtime sync
│   ├── validators.js       # Input and file validation
│   ├── ui-utils.js         # UI utility functions (theme, toast, etc.)
│   └── firebase-config.js  # Firebase credentials
└── docs/
    ├── REFACTORING-PLAN.md # Complete refactoring roadmap
    ├── PHASE3-TESTING.md   # Testing checklist for Phase 3
    └── PHASE-2-COMPLETE.md # Phase 2 completion summary
```

## Usage

### Development

**⚠️ Important**: Because this application uses ES6 modules, you **must** run it through a local web server. Opening `index.html` directly with `file://` protocol will not work.

#### Option 1: Python (recommended)
```bash
python -m http.server 8000
```

#### Option 2: VS Code Live Server
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

#### Option 3: Node.js
```bash
npx serve
```

Then navigate to `http://localhost:8000/index.html`

### Legacy Version
The original single-file monolithic version is still available as `growthvault.html` for reference. It will be moved to an archive folder once the refactoring is complete.

## Technology Stack

- **Frontend**: Pure HTML/CSS/JavaScript (ES6 modules)
- **Architecture**: Modular, component-based design with separation of concerns
- **State Management**: Observer pattern for reactive updates
- **Event Handling**: Event delegation with data-action attributes
- **Storage**: localStorage for offline, Firebase Realtime Database for cloud sync
- **Authentication**: Firebase Auth
- **PWA**: Progressive Web App support with manifest and service worker ready
- **Responsive**: Mobile-first design with breakpoints for tablet and desktop
- **No Build Tools**: Runs natively in modern browsers (Chrome, Firefox, Safari, Edge)

## Architecture

### Manager System
The application uses a modular manager-based architecture:

- **StateManager**: Central state with observer pattern for reactive UI updates
- **StorageManager**: Abstraction layer for localStorage persistence
- **ListManager**: Business logic for items, authors, undo/redo, import/export
- **UIManager**: Renders the DOM, updates templates, manages visual list
- **ModalManager**: Handles content modals and author popups
- **EventHandlers**: Event delegation system routes all user interactions
- **FirebaseManager**: Cloud sync and authentication (optional)
- **Validators**: Input validation and sanitization

### Event System
All user interactions use **event delegation** with `data-action` attributes:
- No inline onclick/onchange/onsubmit handlers
- Single event listener delegates to appropriate handlers
- Clean separation between UI and logic

### Data Flow
1. User interaction → EventHandlers (delegation)
2. EventHandlers → ListManager (business logic)
3. ListManager → StateManager (update state)
4. StateManager → Observers notified (UIManager, FirebaseManager)
5. UIManager → Re-render affected components

## Data Storage

- **Local**: localStorage for offline access (auto-saves on every change)
- **Cloud**: Firebase Realtime Database (when signed in, real-time sync across devices)
- **Export/Import**: JSON format for backups and data portability

## Development

### Running Tests
Comprehensive testing checklist available in `docs/PHASE3-TESTING.md`

### Code Organization
- **config.js**: Single source of truth for constants
- **-manager.js**: Modules following single responsibility principle
- **ui-utils.js**: Pure utility functions with no side effects
- **event-handlers.js**: Central routing for all user interactions

### Browser Requirements
- Modern browser with ES6 module support (2020+)
- localStorage API
- Drag and Drop API
- File API (for image uploads)

### Refactoring Progress
This project has undergone a complete refactoring from a 3,248-line monolithic file to a modular architecture:
- ✅ Phase 0: Discovery & Audit
- ✅ Phase 1: Module entry point stabilization
- ✅ Phase 2: JavaScript extraction into 9 manager modules
- ✅ Phase 3: Inline event handler removal
- 🚧 Phase 4: Consolidation & monolith retirement (in progress)
- ⏳ Phase 5: Testing & QA
- ⏳ Phase 6: Documentation

See `docs/REFACTORING-PLAN.md` for the complete roadmap.

## Contributing

When making changes:
1. Follow the existing modular architecture
2. Use data-action attributes for new interactions
3. Update StateManager for new state properties
4. Add validation in validators.js for new inputs
5. Document public APIs with JSDoc comments
6. Test across mobile, tablet, and desktop breakpoints

## License

[Add your license here]
