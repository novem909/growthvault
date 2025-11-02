# Phase 3 Testing Checklist

## Overview
Phase 3 removed all inline event handlers (onclick, onchange, onsubmit) and replaced them with data-action attributes and event delegation.

## Test Instructions
1. Make sure your local web server is running (`python -m http.server 8000` or Live Server)
2. Open `http://localhost:8000/index.html` in your browser
3. Open browser DevTools Console (F12) to check for errors
4. Test each interaction below

---

## ✅ Header & UI Controls

### Auth Button
- [ ] Click "Sign In" button
- [ ] Should trigger authentication flow (or show "Firebase not initialized" if not configured)

### Theme Toggle
- [ ] Click dark mode toggle button
- [ ] Theme should switch between light/dark
- [ ] Icon should change (🌙 ↔ ☀️)
- [ ] Preference should persist on page reload

### Editable Headers
- [ ] Click main title "Visual List Builder"
- [ ] Should become editable (blue border)
- [ ] Edit the text, press Enter to save
- [ ] Press Escape to cancel editing
- [ ] Click subtitle "Create beautiful..."
- [ ] Should become editable
- [ ] Click "Your Visual List" heading
- [ ] Should become editable

---

## ✅ Form & Data Management

### Add Item
- [ ] Fill in Author name
- [ ] Fill in Title (optional)
- [ ] Fill in Text content
- [ ] Upload an image (optional)
- [ ] Click "Add Item" button
- [ ] Item should appear in the list
- [ ] Form should clear after submission

### Export Data
- [ ] Click "Export Data" button
- [ ] Should download a JSON file with timestamp

### Import Data
- [ ] Click "Import Data" button (label)
- [ ] Select a valid JSON export file
- [ ] Items should load into the list
- [ ] Toast notification should show count

### Clear All
- [ ] Click "Clear All" button
- [ ] Confirm the dialog
- [ ] All items should be deleted
- [ ] Empty state should appear

---

## ✅ List Interactions

### Author Box Drag & Drop
- [ ] Add multiple authors (if not present)
- [ ] Hover over author drag handle (⋮⋮)
- [ ] Drag to reorder author boxes
- [ ] Order should persist after reordering

### Delete Author
- [ ] Click "× Delete Author" button on an author box
- [ ] Confirm the dialog
- [ ] All items by that author should be deleted

### Open Author Popup
- [ ] Click on an author name or author box (not the delete button)
- [ ] Author popup should open showing all items by that author

---

## ✅ Author Popup Modal

### Open/Close
- [ ] Click outside popup to close
- [ ] Press ESC key to close
- [ ] Click × button in header to close

### Item Reordering (Drag & Drop)
- [ ] If author has multiple items, drag items by handle (☰)
- [ ] Items should reorder within the popup
- [ ] Order should persist after closing/reopening

### View Item Content
- [ ] Click on item text in popup
- [ ] Should open Content Modal with full details

### Delete Single Item from Popup
- [ ] Click × button on individual item in popup
- [ ] Confirm deletion
- [ ] Item should be removed
- [ ] If it was the last item, popup should close

### Delete All Items by Author
- [ ] Click "Delete Author" button in popup header
- [ ] Confirm deletion
- [ ] All items should be deleted
- [ ] Popup should close

---

## ✅ Content Modal

### Open/Close
- [ ] Click on any item text in the main list (if visible)
- [ ] Modal should open with full content
- [ ] Click outside modal to close
- [ ] Press ESC to close
- [ ] Click × button to close

### View Image
- [ ] If item has image, it should display in modal
- [ ] Click on image
- [ ] Should open zoomed view

### Format Text (if enabled)
- [ ] Click **B** button to bold text (if toolbar visible)
- [ ] Click • List button to create bullet list

### Delete Item from Modal
- [ ] Click "Delete Content" button
- [ ] Confirm deletion
- [ ] Item should be removed
- [ ] Modal should close

---

## ✅ Image Zoom Overlay

### Zoom Image
- [ ] Click any image (in list, popup, or modal)
- [ ] Zoomed view should open
- [ ] Click outside image to close
- [ ] Click × button to close
- [ ] Press ESC to close
- [ ] Clicking the image itself should NOT close the overlay

---

## ✅ Floating Action Button (FAB)

### Scroll to Form
- [ ] Scroll down the page (if you have many items)
- [ ] Click the + FAB button (bottom-right corner)
- [ ] Should smoothly scroll to the form
- [ ] Author input should be focused

---

## ✅ Keyboard Shortcuts

### Undo
- [ ] Add or delete an item
- [ ] Press Ctrl+Z (or Cmd+Z on Mac) while NOT in an input field
- [ ] Should undo the last action
- [ ] Toast notification should appear

### ESC Key
- [ ] Open any modal or popup
- [ ] Press ESC key
- [ ] Modal/popup should close

---

## 🐛 Known Issues / Expected Behaviors
- Firebase auth requires configuration in `js/firebase-config.js`
- Import only accepts valid JSON files exported from this app
- Undo only works for the most recent action
- Editable headers save automatically when you click away or press Enter

---

## 📊 Console Check
Open DevTools Console (F12) and verify:
- [ ] No red errors (exceptions are ok for Firebase if not configured)
- [ ] Event handlers logged: "✅ Event handlers registered"
- [ ] No "undefined function" errors
- [ ] No inline handler errors

---

## ✅ Phase 3 Success Criteria
- [ ] NO inline onclick/onchange/onsubmit attributes in HTML
- [ ] All interactions use data-action attributes
- [ ] Event delegation handles all user interactions
- [ ] Drag-and-drop uses addEventListener (not inline)
- [ ] No JavaScript errors in console related to event handlers

---

## 🎯 Test Result

**Test Date**: _________________

**Overall Status**: ⬜ Pass / ⬜ Fail

**Issues Found**:
- 
- 
- 

**Tested By**: _________________


