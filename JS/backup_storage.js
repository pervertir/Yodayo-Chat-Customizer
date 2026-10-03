// backup storage
//
// IndexedDB belongs to the website's origin, so it is wiped whenever site data
// is cleared (Brave Shields, "clear cookies and site data on exit", privacy
// cleaners, etc.). Tampermonkey's own storage (GM_setValue) lives inside the
// extension and survives all of that.
//
// Strategy:
//   1. Mirror: every record write/delete is copied to GM storage, one key per record.
//   2. Auto-restore: on startup, if IndexedDB is empty but the mirror has data,
//      the mirror is written back into IndexedDB.
//   3. Snapshots: at most once per SNAPSHOT_INTERVAL_MS a full copy is kept,
//      rotating the last SNAPSHOT_KEEP, to recover from accidental deletes/overwrites.
//
// Size limit: Tampermonkey sends a script's whole GM storage into the page on every
// injection. Large values (embedded images can be several MB each) push that past
// Chrome's message limit, and then NO userscript runs on the page at all. So backups
// only hold settings: string fields longer than BACKUP_MAX_FIELD_CHARS (data: URL images)
// are left out and listed in _backup_omitted. Use JSON export for a full backup.

const MIRROR_PREFIX = 'ycc_rec:';
const SNAPSHOT_PREFIX = 'ycc_snapshot:';
const LAST_FILE_EXPORT_KEY = 'ycc_last_file_export';
const SNAPSHOT_KEEP = 5;
const SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BACKUP_MAX_FIELD_CHARS = 20000;
const BACKUP_OMITTED_KEY = '_backup_omitted';

/**
 * Copy of a record without oversized string fields (embedded images).
 * @param {CharacterRecord} record
 * @returns {CharacterRecord}
 */
function toBackupRecord(record) {
    const copy = {};
    const omitted = [];
    for (const [key, value] of Object.entries(record)) {
        if (key === BACKUP_OMITTED_KEY) continue;
        if (typeof value === 'string' && value.length > BACKUP_MAX_FIELD_CHARS) omitted.push(key);
        else copy[key] = value;
    }
    if (omitted.length) copy[BACKUP_OMITTED_KEY] = omitted;
    return copy;
}

/**
 * Turns backup records back into full records, taking omitted fields from the
 * matching current record where one exists.
 * @param {CharacterRecord[]} backupRecords
 * @param {CharacterRecord[]} currentRecords
 * @returns {CharacterRecord[]}
 */
function restoreOmittedFields(backupRecords, currentRecords) {
    const current = new Map(currentRecords.map(r => [r.CHAR_ID, r]));
    return backupRecords.map(backup => {
        const record = { ...backup };
        const omitted = record[BACKUP_OMITTED_KEY] || [];
        delete record[BACKUP_OMITTED_KEY];
        const existing = current.get(record.CHAR_ID);
        if (existing) omitted.forEach(key => { if (key in existing) record[key] = existing[key]; });
        return record;
    });
}

/**
 * True if a stored backup value still carries an oversized field (written by an older version).
 * @param {*} value
 * @returns {boolean}
 */
function hasOversizedField(value) {
    return !!value && typeof value === 'object' &&
        Object.values(value).some(v => typeof v === 'string' && v.length > BACKUP_MAX_FIELD_CHARS);
}

/**
 * Shrinks backups written by older versions (which stored images) in place.
 * @returns {void}
 */
function compactBackupStorage() {
    if (!isMirrorAvailable()) return;
    GM_listValues().forEach(key => {
        try {
            if (key.startsWith(MIRROR_PREFIX)) {
                const record = GM_getValue(key, null);
                if (hasOversizedField(record)) GM_setValue(key, toBackupRecord(record));
            } else if (key.startsWith(SNAPSHOT_PREFIX)) {
                const snapshot = GM_getValue(key, null);
                if (snapshot && Array.isArray(snapshot.records) && snapshot.records.some(hasOversizedField)) {
                    GM_setValue(key, { ...snapshot, records: snapshot.records.map(toBackupRecord) });
                }
            }
        } catch (e) {
            console.error('Backup compaction failed for', key, e);
        }
    });
}

/**
 * @returns {boolean}
 */
function isMirrorAvailable() {
    return typeof GM_setValue === 'function' && typeof GM_getValue === 'function' && typeof GM_listValues === 'function';
}

/**
 * @param {CharacterRecord} record
 */
function mirrorSaveRecord(record) {
    if (!isMirrorAvailable() || !record || !record.CHAR_ID) return;
    try {
        GM_setValue(MIRROR_PREFIX + record.CHAR_ID, toBackupRecord(record));
    } catch (e) {
        console.error('Mirror save failed:', e);
    }
}

/**
 * @param {string} CHAR_ID
 */
function mirrorDeleteRecord(CHAR_ID) {
    if (!isMirrorAvailable()) return;
    try {
        GM_deleteValue(MIRROR_PREFIX + CHAR_ID);
    } catch (e) {
        console.error('Mirror delete failed:', e);
    }
}

/**
 * @returns {CharacterRecord[]}
 */
function mirrorGetAllRecords() {
    if (!isMirrorAvailable()) return [];
    return GM_listValues()
        .filter(key => key.startsWith(MIRROR_PREFIX))
        .map(key => GM_getValue(key, null))
        .filter(record => record && record.CHAR_ID);
}

/**
 * Replaces the whole mirror with the given records.
 * @param {CharacterRecord[]} records
 */
function mirrorReplaceAll(records) {
    if (!isMirrorAvailable()) return;
    const keep = new Set(records.map(r => MIRROR_PREFIX + r.CHAR_ID));
    GM_listValues()
        .filter(key => key.startsWith(MIRROR_PREFIX) && !keep.has(key))
        .forEach(key => GM_deleteValue(key));
    records.forEach(mirrorSaveRecord);
}

/**
 * @returns {{key: string, timestamp: string, count: number}[]} newest first
 */
function listSnapshots() {
    if (!isMirrorAvailable()) return [];
    return GM_listValues()
        .filter(key => key.startsWith(SNAPSHOT_PREFIX))
        .sort()
        .reverse()
        .map(key => {
            const snapshot = GM_getValue(key, null);
            return { key, timestamp: snapshot?.timestamp, count: snapshot?.records?.length || 0 };
        });
}

/**
 * Takes a full snapshot if the newest one is older than SNAPSHOT_INTERVAL_MS.
 * @param {CharacterRecord[]} records
 * @param {boolean} [force=false]
 */
function takeSnapshotIfDue(records, force = false) {
    if (!isMirrorAvailable() || records.length === 0) return;
    records = records.map(toBackupRecord);
    const snapshots = listSnapshots();
    const newest = snapshots[0];
    if (!force && newest && Date.now() - new Date(newest.timestamp).getTime() < SNAPSHOT_INTERVAL_MS) return;
    // Don't fill the rotation with identical copies
    if (newest && newest.count === records.length &&
        JSON.stringify(getSnapshot(newest.key)?.records) === JSON.stringify(records)) return;

    const timestamp = new Date().toISOString();
    try {
        GM_setValue(SNAPSHOT_PREFIX + timestamp, { version: DB_VERSION, timestamp, records });
    } catch (e) {
        console.error('Snapshot failed:', e);
        return;
    }
    snapshots.slice(SNAPSHOT_KEEP - 1).forEach(s => GM_deleteValue(s.key));
    console.log(`Backup snapshot taken (${records.length} records)`);
}

/**
 * @param {string} key
 * @returns {{version: number, timestamp: string, records: CharacterRecord[]}|null}
 */
function getSnapshot(key) {
    return isMirrorAvailable() ? GM_getValue(key, null) : null;
}

function markFileExported() {
    if (isMirrorAvailable()) GM_setValue(LAST_FILE_EXPORT_KEY, new Date().toISOString());
}

/**
 * @returns {string|null}
 */
function getLastFileExport() {
    return isMirrorAvailable() ? GM_getValue(LAST_FILE_EXPORT_KEY, null) : null;
}
