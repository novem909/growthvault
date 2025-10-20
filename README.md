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
├── index.html              # Main application file
├── growthvault.html        # Original single-file version (legacy)
├── manifest.json           # PWA manifest
├── css/
│   ├── variables.css       # CSS custom properties and themes
│   ├── base.css            # Base styles and typography
│   ├── layout.css          # Layout and grid systems
│   ├── components.css      # UI component styles
│   ├── animations.css      # Keyframe animations
│   └── responsive.css      # Mobile responsive styles
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── ui-utils.js         # UI utility functions
│   └── app.js              # Main application logic (in progress)
└── assets/
    └── icons/              # App icons
```

## Usage

### Development
Open `index.html` in your web browser. For best experience, use a local development server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

Then navigate to `http://localhost:8000`

### Legacy Version
The original single-file version is still available as `growthvault.html`

## Technology

- Pure HTML/CSS/JavaScript
- Modular architecture with separate CSS and JS files
- Firebase for authentication and cloud sync
- Progressive Web App (PWA) support
- Mobile-responsive design
- No build tools required

## Data Storage

- **Local**: localStorage for offline access
- **Cloud**: Firebase Realtime Database (when signed in)
- **Export/Import**: JSON format for backups
