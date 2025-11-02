# GrowthVault Development Guide

**Version**: 2.0  
**Last Updated**: November 2, 2025

Complete guide for developers working on GrowthVault.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Module Development](#module-development)
6. [Testing Guidelines](#testing-guidelines)
7. [Git Workflow](#git-workflow)
8. [Debugging](#debugging)
9. [Performance](#performance)
10. [Deployment](#deployment)

---

## Getting Started

### Prerequisites

- **Modern Browser**: Chrome, Firefox, Edge, or Safari (2020+)
- **Text Editor**: VS Code, Sublime Text, or similar
- **Local Server**: Python, Node.js, or VS Code Live Server
- **Git**: For version control

### Quick Start

```bash
# Clone the repository
git clone https://github.com/novem909/growthvault.git
cd growthvault-html

# Start local server (choose one):

# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: VS Code Live Server
# Right-click index.html → "Open with Live Server"

# Open in browser
open http://localhost:8000/index.html
```

### Why a Local Server?

ES6 modules **require** HTTP(S) protocol. The `file://` protocol will not work due to CORS restrictions.

```javascript
// This will fail with file://
import { StateManager } from './js/state-manager.js';
```

---

## Development Environment

### Recommended VS Code Extensions

1. **Live Server** - One-click local server
2. **ESLint** - JavaScript linting (if you add .eslintrc)
3. **Prettier** - Code formatting
4. **Path Intellisense** - Autocomplete file paths
5. **CSS Peek** - Jump to CSS definitions
6. **GitLens** - Git history and blame

### Browser DevTools Setup

1. **Console**: Check for errors and logs
2. **Network**: Monitor HTTP requests and module loading
3. **Application**: Inspect localStorage data
4. **Sources**: Debug JavaScript with breakpoints
5. **Performance**: Profile rendering and interactions

### Optional Tools

- **TypeScript** (future): Type safety
- **Vite** (future): Build tool for production bundling
- **Jest/Vitest** (future): Unit testing
- **Playwright** (future): E2E testing

---

## Project Structure

```
growthvault-html/
│
├── index.html              # Entry point (DO NOT add inline JS/CSS)
├── README.md               # User-facing documentation
├── manifest.json           # PWA configuration
│
├── css/                    # Modular stylesheets
│   ├── variables.css      # CSS custom properties (edit for theming)
│   ├── base.css           # Resets and typography
│   ├── layout.css         # Container and grid layouts
│   ├── components.css     # UI component styles
│   ├── animations.css     # Keyframes and transitions
│   └── responsive.css     # Media queries
│
├── js/                     # ES6 modules
│   ├── main.js            # Bootstrap (EDIT FOR NEW MANAGERS)
│   ├── config.js          # Constants (EDIT FOR NEW SETTINGS)
│   ├── validators.js      # Pure validation functions
│   ├── storage-manager.js # localStorage abstraction
│   ├── state-manager.js   # State + observer pattern
│   ├── list-manager.js    # Business logic
│   ├── ui-manager.js      # DOM rendering
│   ├── modal-manager.js   # Modal/popup logic
│   ├── event-handlers.js  # Event delegation
│   ├── firebase-manager.js # Cloud sync
│   ├── ui-utils.js        # Global utilities (non-module)
│   └── firebase-config.js # Firebase credentials (non-module)
│
├── docs/                   # Developer documentation
│   ├── ARCHITECTURE.md    # System design
│   ├── API.md             # Module APIs
│   ├── COMPONENTS.md      # UI components
│   ├── DEVELOPMENT.md     # This file
│   ├── REFACTORING-PLAN.md
│   └── PHASE*.md          # Phase summaries
│
└── archive/                # Legacy code (DO NOT EDIT)
    ├── README.md
    └── growthvault.html   # Original monolith
```

### File Naming Conventions

- **HTML**: `kebab-case.html` (e.g., `index.html`)
- **CSS**: `kebab-case.css` (e.g., `variables.css`)
- **JS**: `kebab-case.js` (e.g., `state-manager.js`)
- **Classes**: PascalCase (e.g., `StateManager`)
- **Functions**: camelCase (e.g., `addItem`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_IMAGE_SIZE`)

---

## Coding Standards

### JavaScript (ES6+)

#### Module Structure

```javascript
/**
 * Module description
 * Purpose and responsibilities
 */

// Imports at top
import { CONFIG } from './config.js';
import { StateManager } from './state-manager.js';

// Class definition
export class MyManager {
    /**
     * Constructor with JSDoc
     * @param {StateManager} stateManager - State instance
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        console.log('🚀 MyManager initialized');
    }

    /**
     * Public method with JSDoc
     * @param {string} param - Parameter description
     * @returns {Object} Result object
     */
    myMethod(param) {
        // Implementation
        return { success: true };
    }

    /**
     * Private method (convention: underscore prefix)
     * @private
     */
    _helperMethod() {
        // Internal logic
    }
}

// Default export
export default MyManager;
```

#### Error Handling

Always return result objects:

```javascript
// ✅ GOOD: Return result object
function addItem(data) {
    try {
        // Logic here
        return { success: true, itemId: 123 };
    } catch (error) {
        console.error('Error adding item:', error);
        return { success: false, error: error.message };
    }
}

// ❌ BAD: Throw exceptions
function addItem(data) {
    // Throws unhandled exception
    throw new Error('Failed to add item');
}
```

#### State Updates

Always use StateManager for state changes:

```javascript
// ✅ GOOD: Immutable update via StateManager
const state = stateManager.getState();
stateManager.setState({
    items: [...state.items, newItem]
});

// ❌ BAD: Direct mutation
state.items.push(newItem);
```

#### Event Handling

Use data-action attributes, not inline handlers:

```html
<!-- ✅ GOOD: data-action -->
<button data-action="delete-item" data-item-id="123">Delete</button>

<!-- ❌ BAD: inline onclick -->
<button onclick="deleteItem(123)">Delete</button>
```

### CSS

#### Variable Usage

```css
/* ✅ GOOD: Use CSS variables */
.my-component {
    background-color: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

/* ❌ BAD: Hard-coded colors */
.my-component {
    background-color: #ffffff;
    color: #000000;
}
```

#### Class Naming (BEM-inspired)

```css
/* Block */
.author-box { }

/* Element */
.author-box__header { }
.author-box__title { }

/* Modifier */
.author-box--dragging { }

/* State */
.author-box.is-active { }
```

#### Responsive Design

Mobile-first approach:

```css
/* Base: Mobile styles */
.component {
    font-size: 14px;
    padding: 10px;
}

/* Tablet and up */
@media (min-width: 768px) {
    .component {
        font-size: 16px;
        padding: 15px;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .component {
        padding: 20px;
    }
}
```

### HTML

#### Semantic Elements

```html
<!-- ✅ GOOD: Semantic HTML -->
<header>
    <h1>Title</h1>
    <nav>...</nav>
</header>
<main>
    <article>...</article>
</main>
<footer>...</footer>

<!-- ❌ BAD: Div soup -->
<div class="header">
    <div class="title">Title</div>
</div>
```

#### Accessibility

```html
<!-- Form labels -->
<label for="authorInput">Author</label>
<input type="text" id="authorInput" required>

<!-- Button descriptions -->
<button aria-label="Close modal" class="close-btn">×</button>

<!-- Images -->
<img src="..." alt="Descriptive text">
```

---

## Module Development

### Creating a New Manager

1. **Create file**: `js/my-manager.js`

```javascript
/**
 * MyManager - Description of responsibilities
 */

import { CONFIG } from './config.js';

export class MyManager {
    constructor(dependencies) {
        this.dependency = dependencies.dependency;
        console.log('🔧 MyManager initialized');
    }

    // Public API methods here
}

export default MyManager;
```

2. **Update main.js**:

```javascript
import { MyManager } from './my-manager.js';

// In GrowthVaultApp class:
constructor() {
    // ... existing managers
    this.myManager = new MyManager({ dependency: this.stateManager });
}
```

3. **Update docs/API.md** with public methods

4. **Test thoroughly** before committing

### Adding a New Data-Action

1. **Add to HTML or JS template**:

```html
<button data-action="my-action" data-param="value">Click Me</button>
```

2. **Add handler in event-handlers.js**:

```javascript
setupClickDelegation() {
    document.addEventListener('click', (e) => {
        // ... existing actions
        
        case 'my-action':
            this.handleMyAction(target.dataset.param);
            break;
    });
}

handleMyAction(param) {
    // Implementation
}
```

### Modifying State Structure

1. **Update state-manager.js**:

```javascript
getInitialState() {
    return {
        items: [],
        // ... existing fields
        myNewField: 'default value'
    };
}
```

2. **Update storage-manager.js** if persisting:

```javascript
saveToStorage(items, config) {
    localStorage.setItem('myNewField', config.myNewField);
}
```

3. **Update all consumers** of the state

4. **Test data migration** from old version

---

## Testing Guidelines

### Manual Testing Checklist

Use `docs/PHASE3-TESTING.md` or `docs/PHASE5-TESTING-PLAN.md`.

### Unit Testing (Future)

Example with Vitest:

```javascript
// list-manager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { ListManager } from './list-manager.js';

describe('ListManager', () => {
    let listManager;

    beforeEach(() => {
        listManager = new ListManager(mockState, mockStorage);
    });

    it('should add item successfully', async () => {
        const result = await listManager.addItem({
            author: 'John',
            text: 'Content'
        });
        
        expect(result.success).toBe(true);
        expect(result.itemId).toBeDefined();
    });
});
```

### Browser Testing

Test on at least:
- Chrome (latest)
- Firefox (latest)
- Safari (latest, if on Mac)
- Edge (latest)

Mobile testing:
- Chrome DevTools Device Emulation
- Real device (iOS/Android)

---

## Git Workflow

### Branch Strategy

```
main
  ├── refactor/js-extraction (current)
  ├── feature/new-feature
  ├── fix/bug-description
  └── docs/update-docs
```

### Commit Messages

Follow conventional commits:

```bash
# Feature
git commit -m "feat(list): add bulk delete functionality"

# Bug fix
git commit -m "fix(modal): prevent body scroll when modal open"

# Documentation
git commit -m "docs: update API.md with new methods"

# Refactor
git commit -m "refactor(ui): extract rendering logic to separate file"

# Style
git commit -m "style(css): fix indentation in components.css"

# Test
git commit -m "test: add unit tests for validators"
```

### Pull Request Checklist

- [ ] Code follows standards in this document
- [ ] All console.logs removed (except intentional)
- [ ] No linter errors
- [ ] Tested on at least 2 browsers
- [ ] Mobile responsive checked
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented)

---

## Debugging

### Console Logging Strategy

Use emoji prefixes for visual scanning:

```javascript
console.log('✅ Successfully loaded items');
console.log('🚀 Initializing manager');
console.log('📦 State updated:', state);
console.log('⚠️  Warning: potential issue');
console.error('❌ Error:', error);
```

### Common Issues

#### 1. Module Not Loading

**Error**: `Failed to load module script`

**Solution**: Make sure you're using a local server, not `file://`

#### 2. Event Handler Not Firing

**Check**:
- Is `data-action` attribute set correctly?
- Is element inside `<body>` (delegation works from document)?
- Is case matching in switch statement?

#### 3. State Not Updating

**Check**:
- Using `setState()` instead of direct mutation?
- Observers registered?
- Console log in `notifyObservers()` to verify

#### 4. localStorage Not Persisting

**Check**:
- Browser private/incognito mode (localStorage disabled)?
- localStorage quota exceeded?
- Correct key names in `CONFIG.STORAGE_KEYS`?

### Browser DevTools Tips

```javascript
// Inspect state in console
window.listBuilder.stateManager.getState()

// Inspect localStorage
localStorage.getItem('visualListItems')

// Clear localStorage for testing
localStorage.clear()

// Manually trigger state update
window.listBuilder.stateManager.setState({ items: [] })
```

---

## Performance

### Optimization Guidelines

#### 1. Minimize DOM Manipulations

```javascript
// ✅ GOOD: Batch updates
const html = items.map(item => renderItem(item)).join('');
container.innerHTML = html;

// ❌ BAD: Individual appendChild in loop
items.forEach(item => {
    container.appendChild(renderItem(item)); // Reflow each time
});
```

#### 2. Use Event Delegation

```javascript
// ✅ GOOD: Single listener
document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'delete') { /*...*/ }
});

// ❌ BAD: Listener per element
buttons.forEach(btn => {
    btn.addEventListener('click', handleClick);
});
```

#### 3. Debounce Expensive Operations

```javascript
// Debounce Firebase sync
const debouncedSync = debounce(() => {
    firebaseManager.sync(state);
}, 1000);
```

#### 4. Lazy Load Images (Future)

```javascript
img.loading = 'lazy';
```

### Performance Targets

- **Initial Load**: < 2 seconds
- **Add Item**: < 100ms
- **Render List**: < 200ms (for 100 items)
- **Modal Open**: < 50ms
- **Bundle Size**: < 150KB (uncompressed)

---

## Deployment

### Production Checklist

- [ ] Remove all `console.log` statements
- [ ] Minify CSS and JS (optional, or use CDN)
- [ ] Configure Firebase production credentials
- [ ] Test on all target browsers
- [ ] Run Lighthouse audit (score > 80 in all categories)
- [ ] Update manifest.json with production URLs
- [ ] Enable service worker for offline (future)
- [ ] Set up error tracking (e.g., Sentry)

### Build Script (Future with Vite)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Hosting Options

1. **GitHub Pages**: Free static hosting
2. **Netlify**: Auto-deploy from Git, free tier
3. **Vercel**: Similar to Netlify
4. **Firebase Hosting**: Integrated with Firebase backend

---

## Contributing

### Before You Start

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review [API.md](./API.md)
3. Check [COMPONENTS.md](./COMPONENTS.md)
4. Understand this development guide

### Making Changes

1. **Create feature branch**

```bash
git checkout -b feature/my-feature
```

2. **Make changes following standards**

3. **Test thoroughly**

```bash
# Manual testing
# Use docs/PHASE3-TESTING.md checklist
```

4. **Commit with conventional commits**

```bash
git add .
git commit -m "feat(list): add feature description"
```

5. **Push and create PR**

```bash
git push origin feature/my-feature
```

6. **Code review** and address feedback

7. **Merge after approval**

### Questions?

- Check existing documentation
- Look at similar code for patterns
- Ask in PR comments
- Create an issue for discussion

---

## Troubleshooting

### Development Server Issues

**Problem**: ES6 modules not loading

**Solution**:
```bash
# Make sure you're using HTTP server
python -m http.server 8000
# Then visit http://localhost:8000 (NOT file://)
```

**Problem**: Port already in use

**Solution**:
```bash
# Use different port
python -m http.server 8001
```

### Firebase Issues

**Problem**: Firebase not initialized

**Solution**: Check `js/firebase-config.js` has valid credentials

**Problem**: Permission denied

**Solution**: Check Firebase database rules allow your user

### localStorage Issues

**Problem**: Data not saving

**Solution**: Check browser allows localStorage (not incognito)

**Problem**: Quota exceeded

**Solution**: 
```javascript
// Check usage
storageManager.getStorageSize()

// Clear old data
listManager.clearAllData()
```

---

## Additional Resources

### Documentation

- [MDN Web Docs](https://developer.mozilla.org) - Web standards reference
- [Can I Use](https://caniuse.com) - Browser compatibility
- [CSS Tricks](https://css-tricks.com) - CSS guides and tips
- [Firebase Docs](https://firebase.google.com/docs) - Firebase guides

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Debugging
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [WebPageTest](https://www.webpagetest.org) - Performance testing

### Community

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and ideas

---

## License

[Add your license here]

---

**Happy coding!** 🚀

For questions or issues, please open a GitHub issue or contact the maintainers.


