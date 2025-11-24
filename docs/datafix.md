## Data Sync & Persistence Fix Plan

### Overview
- Mobile/web clients exhibit stale data, missing Firebase syncs, and storage indicators stuck in incorrect states.
- Root cause is async storage/sync calls being treated as synchronous, so UI and cloud updates fire before data actually persists.

### 1. Normalize Async Flow in Event Handlers
- Make every handler that talks to ListManager/Firebase/ModalManager `async`.
- `await` each ListManager call before checking `result.success`, showing toasts, or updating UI.
- Covers delete actions, undo, clear-all, imports, modal delete shortcuts, and auth helpers invoked via `data-action` elements.

### 2. Await Persistence Inside ModalManager
- Convert modal delete/reorder/edit helpers to `async` and `await` their ListManager calls.
- Ensure drag/drop reordering and inline text edits finish saving (and updating timestamps) before popups close, preventing cross-device divergence.

### 3. Fix Storage Info Utilities
- Make `UIManager.updateStorageInfo()` async and await `listManager.getStorageInfo()`.
- Update all callers to `await` the storage refresh so the quota indicator reflects IndexedDB/localStorage reality.
- In `ListManager.addItem()` (and other error paths) await `getStorageInfo()` before composing “storage full” messages for accurate sizes.

### 4. Verification
- Run lint/tests after refactor.
- Manually exercise add/edit/delete, imports, and Firebase sign-in on multiple devices to confirm real-time sync and storage usage updates.
