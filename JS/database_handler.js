// database handler
/**
 * Chat ID from the current URL (the last path segment of /tavern/chat/<id>).
 * @returns {string|undefined}
 */
function getChatIdFromUrl() {
    return window.location.pathname.split('/').filter(Boolean).pop();
}

// The site navigates between pages without reloading, so the entry script refreshes this
// whenever a chat page is entered (see initializeScript).
let CHAT_ID = getChatIdFromUrl();

console.log('Chat ID: ', CHAT_ID);
/**
 * @typedef {Object} CharacterRecord
 * @property {string} CHAR_ID
 * @property {boolean} [apply_to_all]
 * @property {string[]} [chat_ids]
 * @property {string[]} [exclude_chat_ids]
 * @property {string} [background_image]
 * @property {string} [character_alias]
 * @property {string} [chat_name] // shown at the top of the chat; only ever saved on chat records
 * @property {string} [character_name_color]
 * @property {string} [character_image]
 * @property {string} [default_background_image] // URL for the default character background image
 * @property {string} [character_narration_color]
 * @property {string} [character_message_color]
 * @property {string} [character_message_box_color]
 * @property {string} [username_color]
 * @property {string} [user_message_color]
 * @property {string} [user_message_box_color]
 * @property {boolean} [no_universal_colors] // When true, excludes universal color settings from hierarchical merging, forcing fallback to application defaults
 * @property {'chat'|'character'|'universal'} [record_type] // Added for type tracking
 * @property {string} [timestamp] // ISO timestamp when record was created/last updated
 */

/**
 * @param {Element} anchorElement
 * @returns {string|null}
 */
function findCharacterID(anchorElement) {
    // Select the anchor element
    
    // let anchorElement = document.querySelector(char_id_selector);
    if (anchorElement) {
        // Get the href attribute value
        const href = anchorElement.getAttribute('href');

        // Get the last part of the href value (character ID)
        const charID = href.split('/').pop();

        // Return the character ID
        return charID;
    }

    return null; // Return null if the anchor element is not found
}

let db;
/** @type {Promise<IDBDatabase>|undefined} the open in progress, so callers at startup share one */
let dbOpening;

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
    if (!dbOpening) dbOpening = openDatabaseOnce().finally(() => { dbOpening = undefined; });
    return dbOpening;
}

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDatabaseOnce() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Failed to open database:', event.target.error);
            reject(event.target.error);
        };

        request.onblocked = () => console.warn('Database upgrade is waiting for other tabs of this site to reload or close');

        request.onsuccess = async (event) => {
            db = event.target.result;
            // Another tab with a newer version wants to upgrade: let it (this tab reopens on next use)
            db.onversionchange = () => { db.close(); db = undefined; };
            try {
                await syncWithMirror();
            } catch (e) {
                console.error('Backup sync failed:', e);
            }
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(CHARACTER_OBJECT_STORE_NAME)) createInitialSchema();
            const characters = event.target.transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
            // Indexes on image fields copied every embedded image into the index; nothing queries them
            ['character_image', 'background_image', 'default_background_image'].forEach(name => {
                if (characters.indexNames.contains(name)) characters.deleteIndex(name);
            });
            if (!db.objectStoreNames.contains(IMAGE_OBJECT_STORE_NAME)) {
                db.createObjectStore(IMAGE_OBJECT_STORE_NAME, { keyPath: 'hash' });
            }
        };
    });
}

/**
 * Keeps IndexedDB and the Tampermonkey mirror in step on startup.
 * - IndexedDB empty, mirror has data -> site data was wiped: restore from mirror.
 * - Otherwise IndexedDB is the source of truth: refresh the mirror from it.
 * Also moves embedded images to the image store and deletes unused images.
 * @returns {Promise<void>}
 */
async function syncWithMirror() {
    const mirrorAvailable = isMirrorAvailable();
    if (mirrorAvailable) compactBackupStorage();
    let records = await readAllRecords();
    const mirrored = mirrorAvailable ? mirrorGetAllRecords() : [];

    if (records.length === 0 && mirrored.length > 0) {
        // Images were wiped with the site data: references to them are dropped below
        await writeRecords(restoreOmittedFields(mirrored, []), false);
        console.warn(`IndexedDB was empty: restored ${mirrored.length} records from Tampermonkey backup`);
        takeSnapshotIfDue(mirrored);
        records = await readAllRecords();
    }
    records = await migrateRecordImages(records);
    if (mirrorAvailable) {
        mirrorReplaceAll(records);
        takeSnapshotIfDue(records);
    }
    await sweepOrphanImages(records);
}

/**
 * @returns {Promise<CharacterRecord[]>}
 */
function readAllRecords() {
    return new Promise((resolve, reject) => {
        const request = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly')
            .objectStore(CHARACTER_OBJECT_STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Writes records to IndexedDB only (no mirroring) in one transaction.
 * @param {CharacterRecord[]} records
 * @param {boolean} clearExisting
 * @returns {Promise<void>}
 */
function writeRecords(records, clearExisting) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        if (clearExisting) objectStore.clear();
        records.forEach(record => objectStore.put(record));
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Restores a Tampermonkey snapshot into IndexedDB (replacing current data) and the mirror.
 * @param {string} key - snapshot key from listSnapshots()
 * @returns {Promise<number>} number of restored records
 */
async function restoreSnapshot(key) {
    if (!db) await openDatabase();
    const snapshot = getSnapshot(key);
    if (!snapshot || !Array.isArray(snapshot.records)) throw new Error('Snapshot not found');
    const current = await readAllRecords();
    // Keep a copy of the current state so the restore itself can be undone
    takeSnapshotIfDue(current, true);
    // Snapshots leave out embedded images: keep the current ones for matching records
    const records = restoreOmittedFields(snapshot.records, current);
    await writeRecords(records, true);
    mirrorReplaceAll(records);
    return records.length;
}

/**
 * Creates the initial database schema (version 1)
 */
function createInitialSchema() {
    // Create the Characters object store with CHAR_ID as the key path
    const objectStore = db.createObjectStore('Characters', { keyPath: 'CHAR_ID' });

    // Define the attributes and set default values to null
    objectStore.createIndex('chat_ids', 'chat_ids', { unique: false });
    objectStore.createIndex('apply_to_all', 'apply_to_all', { unique: false });
    objectStore.createIndex('exclude_chat_ids', 'exclude_chat_ids', { unique: false });
    objectStore.createIndex('background_image', 'background_image', { unique: false });
    objectStore.createIndex('character_alias', 'character_alias', { unique: false });
    objectStore.createIndex('character_name_color', 'character_name_color', { unique: false });
    objectStore.createIndex('character_image', 'character_image', { unique: false });
    objectStore.createIndex('default_background_image', 'default_background_image', { unique: false });
    objectStore.createIndex('character_narration_color', 'character_narration_color', { unique: false });
    objectStore.createIndex('character_message_color', 'character_message_color', { unique: false });
    objectStore.createIndex('character_message_box_color', 'character_message_box_color', { unique: false });
    objectStore.createIndex('username_color', 'username_color', { unique: false });
    objectStore.createIndex('user_message_color', 'user_message_color', { unique: false });
    objectStore.createIndex('user_message_box_color', 'user_message_box_color', { unique: false });
    objectStore.createIndex('no_universal_colors', 'no_universal_colors', { unique: false });
    objectStore.createIndex('record_type', 'record_type', { unique: false });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });

    console.log('Initial schema (v1) created');
}


/**
 * @template {keyof CharacterRecord} K
 * @param {string} CHAR_ID
 * @param {K} field
 * @returns {Promise<CharacterRecord[K] | null>}
 */
async function getCharacterField(CHAR_ID, field) {
    if (!CHAR_ID) return null; // IndexedDB throws on an undefined key
    if (!db) await openDatabase();
    const value = await new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const request = objectStore.get(CHAR_ID);
        request.onsuccess = (event) => {
            /** @type {CharacterRecord} */
            const result = event.target.result;
            resolve(result && result[field] !== undefined ? result[field] : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
    await resolveRecordImages([{ [field]: value }]);
    return value;
}

// Refactored save/get functions using helpers

/**
 * Deletes the entire character record from the database.
 * @param {string} CHAR_ID
 * @returns {Promise<void>}
 */
async function deleteCharacterRecord(CHAR_ID) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const deleteRequest = objectStore.delete(CHAR_ID);
        deleteRequest.onsuccess = function() { mirrorDeleteRecord(CHAR_ID); resolve(); };
        deleteRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * Loads the full character record from the database.
 * @param {string} CHAR_ID
 * @returns {Promise<CharacterRecord|null>}
 */
async function getCharacterRecord(CHAR_ID) {
    if (!CHAR_ID) return null; // IndexedDB throws on an undefined key
    if (!db) await openDatabase();
    const record = await new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        getRequest.onsuccess = function (event) {
            resolve(event.target.result || null);
        };
        getRequest.onerror = function (e) { reject(e.target.error); };
    });
    await resolveRecordImages([record]);
    return record;
}

/**
 * Saves multiple character fields in a single transaction
 * @param {string} CHAR_ID
 * @param {Partial<CharacterRecord>} fields - Object containing the fields to update
 * @param {string} [currentChatId] - Current chat ID for type detection
 * @param {string} [currentCharId] - Current character ID for type detection
 * @returns {Promise<void>}
 */
async function saveCharacterFieldsBatch(CHAR_ID, fields) {
    if (!db) await openDatabase();
    // Before the transaction: it would close while the images are hashed
    fields = await storeInlineImages(fields);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            
            // Always store no_universal_colors as boolean (even if false) for consistency
            // This flag controls whether universal color settings should be excluded during hierarchical merging
            Object.keys(fields).forEach(field => {
                const value = fields[field];
                if (field === 'no_universal_colors') {
                    // Always store as boolean, even if false
                    record[field] = Boolean(value);
                } else if (value !== null && value !== undefined) {
                    record[field] = value;
                }
            });
            // Set record_type based on explicit field, otherwise fallback to CHAR_ID logic
            if (fields.record_type) {
                record.record_type = fields.record_type;
            } else if (CHAR_ID === 'Universal') {
                record.record_type = 'universal';
            } else if (CHAR_ID === CHAT_ID) {
                record.record_type = 'chat';
            } else {
                record.record_type = 'character'; // Default
            }
            
            // Add or update timestamp - use existing timestamp if updating, otherwise create new one
            if (!record.timestamp) {
                record.timestamp = new Date().toISOString();
            }
            
            const putRequest = objectStore.put(record);
            putRequest.onsuccess = function() { mirrorSaveRecord(record); resolve(); };
            putRequest.onerror = function(e) { reject(e.target.error); };
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * Exports all character records from the database as JSON
 * @returns {Promise<string>} JSON string containing all records
 */
async function exportDatabase() {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getAllRequest = objectStore.getAll();
        
        getAllRequest.onsuccess = async function(event) {
            try {
                const allRecords = event.target.result;
                const exportData = {
                    version: DB_VERSION,
                    timestamp: new Date().toISOString(),
                    records: allRecords,
                    // Each image once, as a data: URL keyed by the hash the records refer to
                    images: await exportRecordImages(allRecords)
                };
                resolve(JSON.stringify(exportData, null, 2));
            } catch (e) {
                reject(e);
            }
        };
        
        getAllRequest.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

/**
 * Imports character records from JSON data into the database
 * @param {string} jsonData - JSON string containing the records to import
 * @param {boolean} [clearExisting=false] - Whether to clear existing data before import
 * @returns {Promise<{imported: number, errors: string[]}>}
 */
async function importDatabase(jsonData, clearExisting = false) {
    if (!db) await openDatabase();
    
    return new Promise((resolve, reject) => {
        let importData;
        try {
            importData = JSON.parse(jsonData);
        } catch (e) {
            reject(new Error('Invalid JSON data: ' + e.message));
            return;
        }
        
        if (!importData.records || !Array.isArray(importData.records)) {
            reject(new Error('Invalid import format: missing or invalid records array'));
            return;
        }
        
        resolve(storeImportedImages(importData).then(async imageErrors => {
            const result = await runImport(importData, clearExisting);
            return { ...result, errors: [...imageErrors, ...result.errors] };
        }));
    });
}

/**
 * Stores the images of an import: the export's image list, and images embedded in records by
 * older versions (one record at a time, before the import transaction, which would close while
 * they are hashed).
 * @param {{records: CharacterRecord[], images?: Object<string, string>}} importData
 * @returns {Promise<string[]>} errors
 */
async function storeImportedImages(importData) {
    const errors = await importRecordImages(importData.images);
    for (let i = 0; i < importData.records.length; i++) {
        if (importData.records[i]) importData.records[i] = await storeInlineImages(importData.records[i]);
    }
    return errors;
}

/**
 * @param {{records: CharacterRecord[]}} importData
 * @param {boolean} clearExisting
 * @returns {Promise<{imported: number, errors: string[]}>}
 */
async function runImport(importData, clearExisting) {
    // Snapshot the pre-import state so the import can be undone from "Recover"
    try {
        takeSnapshotIfDue(await readAllRecords(), true);
    } catch (e) {
        console.error('Pre-import snapshot failed:', e);
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        
        let imported = 0;
        const errors = [];
        
        const processImport = () => {
            const promises = [];
            
            // Clear existing data if requested
            if (clearExisting) {
                promises.push(new Promise((clearResolve, clearReject) => {
                    const clearRequest = objectStore.clear();
                    clearRequest.onsuccess = () => clearResolve();
                    clearRequest.onerror = (e) => clearReject(e.target.error);
                }));
            }
            
            Promise.all(promises).then(() => {
                // Import each record
                importData.records.forEach((record, index) => {
                    if (!record.CHAR_ID) {
                        errors.push(`Record ${index}: Missing CHAR_ID`);
                        return;
                    }
                    
                    try {
                        const putRequest = objectStore.put(record);
                        putRequest.onsuccess = () => imported++;
                        putRequest.onerror = (e) => {
                            errors.push(`Record ${record.CHAR_ID}: ${e.target.error.message}`);
                        };
                    } catch (e) {
                        errors.push(`Record ${record.CHAR_ID}: ${e.message}`);
                    }
                });
                
                transaction.oncomplete = () => {
                    // Mirror and snapshot the imported state before resolving (the UI reloads right after)
                    readAllRecords()
                        .then(records => {
                            mirrorReplaceAll(records);
                            takeSnapshotIfDue(records, true);
                        })
                        .catch(e => console.error('Mirror refresh failed:', e))
                        .finally(() => resolve({ imported, errors }));
                };
                
                transaction.onerror = (e) => {
                    reject(e.target.error);
                };
            }).catch(reject);
        };
        
        processImport();
    });
}

/**
 * Gets all character records from the database
 * @returns {Promise<CharacterRecord[]>}
 */
async function getAllCharacterRecords() {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getAllRequest = objectStore.getAll();
        
        getAllRequest.onsuccess = function(event) {
            const records = event.target.result || [];
            resolveRecordImages(records).then(() => resolve(records), reject);
        };
        
        getAllRequest.onerror = function(e) {
            reject(e.target.error);
        };
    });
}
