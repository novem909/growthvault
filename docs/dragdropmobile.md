# Mobile Touch Drag & Drop Implementation Plan
## "Effortless. Intuitive. Delightful."

---

## Philosophy (Steve Jobs Inspired)

> "Design is not just what it looks like and feels like. Design is how it works."

The mobile drag & drop experience must feel **natural** - like moving physical objects. No learning curve. No frustration. Just touch, hold, move, release.

---

## Current State

- Desktop: Uses HTML5 Drag and Drop API (`dragstart`, `dragover`, `drop`)
- Mobile: **Disabled** - touch devices don't support native drag events
- Affected areas:
  1. **Author boxes** on main page (reorder authors)
  2. **Items in author popup** (reorder within folder/unfiled)
  3. **Items to folders** (move items between folders)

---

## Implementation Plan

### Phase 1: Touch Event Foundation

**Create `js/touch-drag.js`** - A lightweight touch drag handler (~3KB)

```javascript
// Core touch events to implement:
- touchstart  → Begin drag (after 200ms hold)
- touchmove   → Update position, find drop target
- touchend    → Complete drop or cancel
- touchcancel → Handle interruptions
```

**Key Features:**
- **Long-press to drag** (200ms) - prevents accidental drags while scrolling
- **Visual lift effect** - element scales up slightly, adds shadow
- **Haptic feedback** (if available) - `navigator.vibrate(10)`
- **Ghost element** - semi-transparent clone follows finger
- **Auto-scroll** - scroll container when dragging near edges

---

### Phase 2: Visual Feedback System

**Drag States (CSS classes):**
```css
.touch-dragging      /* Element being dragged */
.touch-drag-ghost    /* Following finger */
.touch-drop-target   /* Valid drop zone highlighted */
.touch-drag-over     /* Hovering over drop target */
```

**Animations:**
- **Pickup**: Scale 1.05, elevation shadow, slight rotation (2deg)
- **Drop valid**: Smooth slide to new position (200ms ease-out)
- **Drop invalid**: Snap back with bounce (300ms spring)
- **Placeholder**: Subtle pulse where item will land

---

### Phase 3: Integration Points

#### 3A. Author Boxes (Main Page)
- Long-press author box → lift and drag
- Other boxes shift to show insertion point
- Release → animate to new position, save order

#### 3B. Items in Author Popup  
- Long-press item → lift and drag
- Scroll popup if needed (auto-scroll near edges)
- Drop between items or into folders
- Release → animate, update state

#### 3C. Folder Drop Targets
- Dragging item over folder header → folder highlights
- Drop on folder → item moves into folder
- Drop on "Unfiled" section → remove from folder

---

### Phase 4: Performance Optimizations

1. **RequestAnimationFrame** for smooth 60fps movement
2. **Will-change: transform** on draggable elements
3. **Passive event listeners** where possible
4. **Debounced drop target detection** (check every 50ms, not every pixel)
5. **CSS transforms only** (no layout thrashing)
6. **Minimal DOM reads** during drag

---

### Phase 5: Edge Cases & Polish

- **Scroll while dragging**: Auto-scroll when near container edges
- **Cancel gesture**: Drag back to original position to cancel
- **Accessibility**: Ensure items still accessible via tap (not just drag)
- **Interruptions**: Handle incoming calls, notifications gracefully
- **Orientation change**: Cancel drag if device rotates
- **Multi-touch**: Ignore additional fingers during drag

---

## File Changes

| File | Changes |
|------|---------|
| `js/touch-drag.js` | **NEW** - Touch drag handler class |
| `js/ui-manager.js` | Initialize touch drag for author boxes |
| `js/modal-manager.js` | Initialize touch drag for popup items |
| `css/components.css` | Add touch drag state styles |
| `css/animations.css` | Add drag animations |
| `index.html` | Import touch-drag.js |

---

## API Design

```javascript
// Simple, declarative API
const touchDrag = new TouchDragHandler({
    container: '#visualList',
    draggable: '.author-box',
    handle: '.author-drag-handle', // Optional
    dropTargets: '.author-box',
    holdDuration: 200,
    onDragStart: (item) => {},
    onDragMove: (item, x, y) => {},
    onDrop: (item, target, position) => {},
    onCancel: (item) => {}
});
```

---

## Success Criteria

1. **No lag** - 60fps during drag
2. **No accidental drags** - scrolling still works naturally  
3. **Clear feedback** - always know what will happen on release
4. **Forgiving** - easy to cancel, hard to make mistakes
5. **Consistent** - same feel across all draggable areas
6. **Accessible** - doesn't break tap-to-open functionality

---

## Timeline Estimate

- Phase 1 (Foundation): ~2 hours
- Phase 2 (Visual Feedback): ~1 hour  
- Phase 3 (Integration): ~2 hours
- Phase 4 (Performance): ~1 hour
- Phase 5 (Polish): ~1 hour

**Total: ~7 hours**

---

## Risk Mitigation

1. **Feature flag**: Can disable touch drag without affecting desktop
2. **Graceful degradation**: Falls back to tap-based UI if touch drag fails
3. **No library dependencies**: Pure vanilla JS, no external deps
4. **Isolated code**: Touch drag is separate module, easy to remove/replace
