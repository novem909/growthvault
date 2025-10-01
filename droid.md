# Droid Guidelines for GrowthVault Project

## Project Awareness
- **Project Type**: Single-file web application (HTML/CSS/JavaScript)
- **Main File**: `growthvault.html` - Complete application in one file
- **Architecture**: Client-side only, uses localStorage for persistence
- **Key Features**: Visual List Builder with author-based content organization, drag-and-drop, dark/light themes, undo/redo system, export/import functionality
- **Planning Docs**: No separate planning documents - all functionality contained in single HTML file
- **Task Management**: Built-in todo system within the application interface

## Testing Requirements
- **Unit Tests**: No formal testing framework currently implemented
- **Testing Approach**: Manual browser testing recommended
- **Coverage Expectations**: Focus on core functionality:
  - Author management (add/edit/delete/reorder)
  - Content item manipulation (add/edit/delete/reorder)
  - Theme switching (dark/light mode)
  - Data persistence (localStorage operations)
  - Export/import functionality
  - Undo/redo operations
- **Browser Compatibility**: Test in major browsers (Chrome, Firefox, Safari, Edge)
- **Responsive Testing**: Verify mobile and desktop layouts

## Code Structure
- **File Organization**: Single HTML file containing all code
- **File Size**: Current ~94KB - consider splitting if significantly larger
- **Module Organization**:
  - HTML structure at top
  - CSS styles in `<style>` section
  - JavaScript functionality in `<script>` section
- **Code Sections**:
  - DOM manipulation functions
  - Data management (localStorage)
  - UI event handlers
  - Theme management
  - Drag-and-drop functionality
  - Modal management
  - Import/export utilities

## Style Conventions
- **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Formatting**:
  - 2-space indentation for HTML and CSS
  - 4-space indentation for JavaScript
  - Consistent naming: camelCase for JavaScript, kebab-case for CSS classes
- **JavaScript Patterns**:
  - Use const/let instead of var
  - Arrow functions for callbacks
  - Template literals for string interpolation
  - Async/await for asynchronous operations
- **CSS Conventions**:
  - BEM-like naming for components
  - CSS custom properties for theming
  - Mobile-first responsive design
- **Code Comments**: 
  - Minimal but meaningful comments
  - Document complex logic and business rules
  - Avoid obvious comments

## Development Guidelines
- **Performance**: Keep file size reasonable, optimize for fast loading
- **Accessibility**: Maintain keyboard navigation and screen reader compatibility
- **Security**: Client-side only - no server-side security concerns
- **Data Safety**: Always backup localStorage data before major changes
- **Browser Support**: Target modern browsers with graceful degradation
- **Maintenance**: Keep all related code in single file for simplicity unless size becomes unwieldy
