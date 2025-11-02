# GrowthVault Testing Checklist

**Branch:** `refactor/js-extraction`  
**Testing Phase 2 Refactoring**

---

## 🧪 Quick Smoke Test (5 minutes)

### 1. **App Loads**
- [ ] Open `index.html` in browser
- [ ] No console errors (check F12 → Console tab)
- [ ] See "GrowthVault" title and form
- [ ] Console shows: `🎉 Application ready!`

### 2. **Add First Item**
- [ ] Fill in Author: "Test User"
- [ ] Fill in Title: "My First Item"
- [ ] Fill in Text: "This is a test item"
- [ ] Click "Add Item" button
- [ ] ✅ See green toast: "Item added successfully!"
- [ ] ✅ See author box appear with "Test User"
- [ ] ✅ Author box shows count: "1"

### 3. **View Item**
- [ ] Click on the "Test User" author box
- [ ] ✅ Popup opens showing your item
- [ ] ✅ Item shows title, text, and date
- [ ] Click on the item
- [ ] ✅ Modal opens showing full content
- [ ] Press `ESC` key
- [ ] ✅ Modal closes

### 4. **Data Persistence**
- [ ] Refresh the page (F5)
- [ ] ✅ Your item is still there!
- [ ] ✅ Data persisted to localStorage

---

## 🎯 Full Feature Test (15 minutes)

### Form Validation
- [ ] Try adding item with empty author → Should show error
- [ ] Try adding item with no text and no image → Should show error
- [ ] Add item with only text (no image) → Should work
- [ ] Add item with only image (no text) → Should work
- [ ] Add item with very long text (500+ chars) → Should work

### Image Upload
- [ ] Click "Choose File" button
- [ ] Select an image (JPG/PNG)
- [ ] Add the item
- [ ] ✅ Image appears in modal when clicked
- [ ] ✅ Image size under 5MB works
- [ ] Try uploading 6MB+ image → Should show error
- [ ] Try uploading .txt file → Should show error

### Multiple Authors
- [ ] Add item with Author: "Alice"
- [ ] Add item with Author: "Bob"
- [ ] Add item with Author: "Alice" (again)
- [ ] ✅ See 2 author boxes (Alice shows "2", Bob shows "1")
- [ ] ✅ Authors grouped correctly

### Drag & Drop Reordering
- [ ] Hover over author box
- [ ] ✅ See drag handle (≡ icon)
- [ ] Click and drag the handle
- [ ] Drop on another author box
- [ ] ✅ Authors reorder
- [ ] Refresh page
- [ ] ✅ Order persists

### Author Popup
- [ ] Click author box
- [ ] ✅ Popup opens with all items by that author
- [ ] ✅ Each item shows title, text preview, date
- [ ] ✅ If item has image, image thumbnail shows
- [ ] Click anywhere outside popup
- [ ] ✅ Popup closes
- [ ] Reopen popup, click item
- [ ] ✅ Opens content modal

### Content Modal
- [ ] Open an item modal
- [ ] ✅ Shows author name, date, title
- [ ] ✅ Shows full text
- [ ] ✅ Shows image if present
- [ ] Click on the text
- [ ] ✅ Text becomes editable
- [ ] Edit the text
- [ ] Click outside text area
- [ ] ✅ Changes save automatically
- [ ] Close and reopen modal
- [ ] ✅ Edited text persisted

### Delete Operations
- [ ] Open author popup
- [ ] Click "×" button on an item
- [ ] ✅ Item deleted
- [ ] ✅ Remains in popup until closed
- [ ] Close and reopen popup
- [ ] ✅ Deleted item gone
- [ ] On main page, click "×" on author box
- [ ] ✅ Confirmation dialog appears
- [ ] Confirm deletion
- [ ] ✅ All items by that author deleted
- [ ] ✅ Author box removed

### Undo System
- [ ] Add an item
- [ ] Delete the item
- [ ] Press `Ctrl+Z` (Windows) or `Cmd+Z` (Mac)
- [ ] ✅ Item restored!
- [ ] ✅ Green notification shows: "Restored: [item title]"
- [ ] Delete an entire author (all items)
- [ ] Press `Ctrl+Z`
- [ ] ✅ All items restored
- [ ] Press `Ctrl+Z` with nothing to undo
- [ ] ✅ Toast shows: "Nothing to undo"

### Keyboard Shortcuts
- [ ] Open modal, press `ESC`
- [ ] ✅ Modal closes
- [ ] Open author popup, press `ESC`
- [ ] ✅ Popup closes
- [ ] Delete item, press `Ctrl+Z`
- [ ] ✅ Undo works
- [ ] Click in form text field, press `Ctrl+Z`
- [ ] ✅ Undo does NOT trigger (only works outside inputs)

### Dark Mode
- [ ] Click dark mode toggle (moon icon)
- [ ] ✅ Interface switches to dark theme
- [ ] ✅ All colors invert properly
- [ ] ✅ Text remains readable
- [ ] Refresh page
- [ ] ✅ Dark mode persists
- [ ] Toggle back to light mode
- [ ] ✅ Switches back

### Export/Import
- [ ] Add several items
- [ ] Click "Export Data" button
- [ ] ✅ JSON file downloads
- [ ] ✅ Filename includes date: `growthvault-export-YYYY-MM-DD.json`
- [ ] Open the JSON file in notepad
- [ ] ✅ See your data in JSON format
- [ ] Click "Clear All Data"
- [ ] Confirm deletion
- [ ] ✅ All items gone
- [ ] Click "Import Data" button
- [ ] Select the exported JSON file
- [ ] ✅ All items restored!

### Firebase Authentication (Optional)
*Only test if Firebase is configured*

- [ ] Click "Sign In" button
- [ ] ✅ Google sign-in popup appears
- [ ] Sign in with Google account
- [ ] ✅ Button changes to "Sign Out"
- [ ] ✅ Sync status appears: "Synced"
- [ ] Add an item
- [ ] ✅ Sync indicator shows "Syncing..." then "Synced"
- [ ] Open app in incognito/different browser
- [ ] Sign in with same account
- [ ] ✅ Data syncs from cloud
- [ ] Sign out
- [ ] ✅ Returns to local-only mode

---

## 📱 Mobile/Responsive Test

### Desktop → Mobile
- [ ] Open DevTools (F12)
- [ ] Click "Toggle device toolbar" (Ctrl+Shift+M)
- [ ] Select "iPhone 12 Pro" or similar
- [ ] ✅ Layout adapts to mobile
- [ ] ✅ Form stacks vertically
- [ ] ✅ Author boxes resize properly
- [ ] ✅ Modals are full-screen on mobile
- [ ] ✅ All buttons are tappable

### Orientation
- [ ] In mobile view, click rotate icon
- [ ] Switch between portrait/landscape
- [ ] ✅ Layout adapts smoothly
- [ ] ✅ No horizontal scrolling issues

### Touch Interactions
- [ ] (If you have a touchscreen)
- [ ] Tap author box → opens popup
- [ ] Swipe to scroll popup content
- [ ] Tap outside popup → closes
- [ ] ✅ Touch targets are large enough

---

## 🐛 Error Handling Test

### Network Issues
- [ ] Open DevTools → Network tab
- [ ] Check "Offline" checkbox
- [ ] Try to sign in with Firebase
- [ ] ✅ Shows error toast
- [ ] ✅ App still works locally

### Invalid Data
- [ ] Open DevTools → Console
- [ ] Type: `window.app.listManager.addItem({})`
- [ ] ✅ Returns validation error
- [ ] ✅ App doesn't crash

### Storage Quota
- [ ] Add 50+ items with large images
- [ ] ✅ Storage info updates
- [ ] ✅ No crashes when storage fills

---

## 🔍 Console Check

### Expected Logs
Open Console (F12) and verify you see:

**On Load:**
```
🚀 GrowthVault loading...
🎨 UI Utils loaded
📋 StateManager initialized
💾 StorageManager initialized
✅ All managers initialized
🔧 Initializing application...
🎨 UIManager initialized
🖼️  ModalManager initialized
🎯 EventHandlers initialized
🔥 FirebaseManager initialized
✅ Event handlers registered
✅ GrowthVault initialized successfully
🎉 Application ready!
```

**When Adding Item:**
```
✅ Item added: [timestamp]
```

**When Deleting:**
```
🗑️  Item deleted: [id]
💾 Undo state saved: deleteItem
```

**When Undoing:**
```
↩️  Undone action: deleteItem
```

### ❌ Should NOT See:
- Any red errors
- "undefined is not a function"
- "Cannot read property of undefined"
- "Module not found"

---

## ✅ Pass Criteria

### Must Pass:
- ✅ App loads without console errors
- ✅ Can add items
- ✅ Can delete items
- ✅ Data persists after refresh
- ✅ Author boxes render
- ✅ Modals open/close
- ✅ Undo works (Ctrl+Z)
- ✅ No linter errors

### Nice to Have:
- ✅ Firebase auth works (if configured)
- ✅ Drag & drop smooth
- ✅ Mobile responsive
- ✅ Dark mode works

---

## 🚨 If Something Fails

### 1. Check Console Errors
- Open DevTools (F12) → Console tab
- Copy the error message
- Note which action triggered it

### 2. Check Network Tab
- DevTools → Network tab
- Look for failed requests (red)
- Check if JS modules loaded (200 status)

### 3. Check Application Tab
- DevTools → Application tab
- Look at localStorage
- Should see key: `growthvault_data`

### 4. Report Issue
Include:
- Which test failed
- Console error messages
- Steps to reproduce
- Browser/version

---

## 🎉 Success Metrics

If you passed:
- ✅ **10+ Basic Tests**: Ready for Phase 3!
- ✅ **20+ Full Tests**: Excellent!
- ✅ **All Tests**: Perfect! Ship it! 🚀

---

**Last Updated:** November 1, 2025  
**Next:** Phase 3 - HTML cleanup and event handler migration



