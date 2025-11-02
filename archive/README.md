# Archive

This folder contains the legacy monolithic version of GrowthVault.

## growthvault.html (3,248 lines)

The original single-file implementation containing:
- All HTML structure (147 lines preserved in index.html)
- All CSS styles (1,465 lines extracted to css/ directory)
- All JavaScript logic (~1,500 lines extracted to js/ directory)

### Why Archived?

This file has been replaced by the modular architecture for the following reasons:

1. **Maintainability**: Easier to locate and modify specific features
2. **Collaboration**: Multiple developers can work on different modules simultaneously
3. **Testing**: Individual modules can be tested in isolation
4. **Mobile UI Changes**: CSS breakpoints and responsive design are now in dedicated files
5. **Code Reusability**: Managers and utilities can be reused across features
6. **Separation of Concerns**: Clear boundaries between state, UI, events, and storage

### Refactoring Timeline

- **Oct 20, 2025**: Initial CSS extraction started (80% complete, then abandoned)
- **Nov 2, 2025**: Refactoring resumed
  - Phase 0: Discovery & Audit
  - Phase 1: Module entry point (main.js)
  - Phase 2: JavaScript extraction (9 manager modules)
  - Phase 3: Event delegation (removed inline handlers)
  - Phase 4: Archive monolith, update documentation

### When to Reference This File

- Comparing behavior with the refactored version
- Verifying feature parity during QA
- Understanding original implementation choices
- Debugging edge cases that may have been overlooked

### Do Not Use This File

- For new feature development
- For bug fixes (use modular files instead)
- For production deployment (use index.html + modular architecture)

**Last Updated**: November 2, 2025

