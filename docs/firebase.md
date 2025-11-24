## Firebase-First Storage Plan

### Goals
- Eliminate browser quota errors by making Firebase the primary persistence layer
- Preserve offline capability via optional local cache without risking data divergence
- Maintain existing cross-device/account sync guarantees using monotonic timestamps

### Current Pain Points
1. Local storage/IndexedDB quotas vary per browser, triggering misleading 5 MB warnings
2. Writes succeed locally but can still fail to sync if timestamps lag or cache corrupts
3. Multiple storage layers increase complexity and leave room for subtle race conditions

### Proposed Architecture
1. **Firebase as Source of Truth**: All create/update/delete operations write to Firebase first, await confirmation, then update memory/UI.
2. **Optional Cache Layer**: IndexedDB becomes an offline cache that mirrors the last confirmed Firebase snapshot and buffers offline writes.
3. **Deterministic Versioning**: Reuse existing monotonic timestamps; every write includes `lastKnownTimestamp` so Firebase merges only forward-moving updates.
4. **Listener-Driven Sync**: Firebase real-time listeners hydrate the state on startup and whenever remote changes occur, feeding directly into StateManager/ListManager.

### Migration Phases
1. **Phase 0 – Abstraction**
   - Introduce a `PersistenceAdapter` interface that StorageManager implements.
   - Ensure ListManager/StateManager depend only on this interface.
2. **Phase 1 – Firebase Adapter**
   - Implement `FirebasePersistenceAdapter` covering load/save/delete/listener registration.
   - Route UI actions through the adapter while keeping IndexedDB as a background cache.
3. **Phase 2 – Cache + Offline Support**
   - Add queueing of offline mutations with retry/backoff once connectivity returns.
   - Keep a lightweight snapshot in IndexedDB for instant resume; refresh it after each confirmed Firebase write.
4. **Phase 3 – Telemetry & Guardrails**
   - Record success/failure metrics for Firebase ops and cache sync drift.
   - Surface clear UI states for offline, syncing, and conflict resolution.

### Data Flow
1. User action → StateManager mutates memory state tentatively.
2. Persistence adapter writes to Firebase with `{payload, timestamp, lastKnownTimestamp}`.
3. On success, adapter updates IndexedDB snapshot + clears any queued mutation.
4. Firebase listener broadcasts authoritative snapshot → StateManager reconciles using timestamps (no local overwrite when remote older).

### Risks & Mitigations
- **Network Latency**: Use optimistic UI plus spinners; roll back on Firebase failure.
- **Offline Edits**: Queue mutations in IndexedDB with deterministic IDs; replay when online.
- **Conflict Resolution**: Maintain monotonic timestamps and prefer highest timestamp; if equal, use deterministic tie-breaker (e.g., client ID).
- **Migration Safety**: Provide one-time migration that uploads existing IndexedDB snapshot to Firebase before switching clients over.

### Open Questions
1. Do we need multi-account separation beyond Firebase auth UID namespace?
2. Are there enterprise requirements for data export/backup once Firebase hosts canonical data?
3. Should users be able to opt out of cloud storage (local-only mode)?
