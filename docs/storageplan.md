# Storage Sync Remediation Plan

## Issue Summary
- `StorageManager` and `IndexedDBManager` always reuse incoming `data.timestamp`, so once `stateManager.lastSaveTimestamp` is set, later saves never advance the timestamp.
- `ListManager.save()` therefore keeps writing stale timestamps to storage and Firebase.
- `FirebaseManager` compares remote vs. local timestamps and refuses to load data with the same timestamp, leaving mobile/web copies divergent.

## Plan
1. **Timestamp strategy** – Teach `ListManager.save()` to strip `timestamp` on normal saves so storage layers generate a fresh ISO string, while allowing explicit preservation (e.g., when ingesting Firebase data or running migrations).
2. **Storage-layer options** – Update `StorageManager.save()` and `IndexedDBManager.save()` to accept options such as `{ preserveTimestamp }`, honor them when deciding whether to reuse an existing timestamp, and return whichever timestamp was persisted so `stateManager.lastSaveTimestamp` stays accurate.
3. **Call-site audit** – Ensure every local mutation path (add/edit/delete/import/reorder/undo, etc.) uses the default “new timestamp” flow, and only Firebase-driven loads or migrations request timestamp preservation.
4. **Verification** – Add logging around timestamp creation/preservation, then regression-test cross-device edits, Firebase listener behavior, and import/migration flows to confirm timestamps advance and data syncs correctly.
