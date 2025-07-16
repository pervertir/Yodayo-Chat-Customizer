// database handler
const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();

console.log('Chat ID: ', CHAT_ID);
/**
 * @typedef {Object} CharacterRecord
 * @property {string} CHAR_ID
 * @property {boolean} [apply_to_all]
 * @property {string[]} [chat_ids]
 * @property {string[]} [exclude_chat_ids]
 * @property {string} [background_image]
 * @property {string} [character_alias]
 * @property {string} [character_name_color]
 * @property {string} [character_image]
 * @property {string} [default_background_image] // URL for the default character background image
 * @property {string} [character_narration_color]
 * @property {string} [character_message_color]
 * @property {string} [character_message_box_color]
 * @property {string} [username_color]
 * @property {string} [user_message_color]
 * @property {string} [user_message_box_color]
 * @property {'chat'|'character'|'universal'} [record_type] // Added for type tracking
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

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Failed to open database:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            createInitialSchema();
            console.log('Initial schema (v1) created');
        };
    });
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
    objectStore.createIndex('record_type', 'record_type', { unique: false });

    console.log('Initial schema (v1) created');
}

/**
 * @template {keyof CharacterRecord} K
 * @param {string} CHAR_ID
 * @param {K} field
 * @param {CharacterRecord[K] | null} value
 * @param {string} [currentChatId] - Current chat ID for type detection
 * @param {string} [currentCharId] - Current character ID for type detection
 * @returns {Promise<void>}
 */
async function saveCharacterField(CHAR_ID, field, value, currentChatId, currentCharId) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            
            // Set the field value
            record[field] = value;
            
            // Determine record type if not already set
            if (!record.record_type && currentChatId && currentCharId) {
                if (CHAR_ID === 'Universal') {
                    record.record_type = 'universal';
                } else if (CHAR_ID === currentChatId) {
                    record.record_type = 'chat';
                } else if (CHAR_ID === currentCharId) {
                    record.record_type = 'character';
                } else {
                    record.record_type = 'character'; // Default
                }
            }
            
            const putRequest = objectStore.put(record);
            putRequest.onsuccess = function() { resolve(); };
            putRequest.onerror = function(e) { reject(e.target.error); };
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * @template {keyof CharacterRecord} K
 * @param {string} CHAR_ID
 * @param {K} field
 * @returns {Promise<CharacterRecord[K] | null>}
 */
async function getCharacterField(CHAR_ID, field) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
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
        deleteRequest.onsuccess = function() { resolve(); };
        deleteRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * Loads the full character record from the database.
 * @param {string} CHAR_ID
 * @returns {Promise<CharacterRecord|null>}
 */
async function getCharacterRecord(CHAR_ID) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        getRequest.onsuccess = function (event) {
            resolve(event.target.result || null);
        };
        getRequest.onerror = function (e) { reject(e.target.error); };
    });
}

/**
 * Saves multiple character fields in a single transaction
 * @param {string} CHAR_ID
 * @param {Partial<CharacterRecord>} fields - Object containing the fields to update
 * @param {string} [currentChatId] - Current chat ID for type detection
 * @param {string} [currentCharId] - Current character ID for type detection
 * @returns {Promise<void>}
 */
async function saveCharacterFieldsBatch(CHAR_ID, fields, currentChatId, currentCharId) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            
            // Update all provided fields
            Object.keys(fields).forEach(field => {
                const value = fields[field];
                if (value !== null && value !== undefined) {
                    record[field] = value;
                }
            });
            
            // Determine record type if not already set
            if (!record.record_type && currentChatId && currentCharId) {
                if (CHAR_ID === 'Universal') {
                    record.record_type = 'universal';
                } else if (CHAR_ID === currentChatId) {
                    record.record_type = 'chat';
                } else if (CHAR_ID === currentCharId) {
                    record.record_type = 'character';
                } else {
                    record.record_type = 'character'; // Default
                }
            }
            
            const putRequest = objectStore.put(record);
            putRequest.onsuccess = function() { resolve(); };
            putRequest.onerror = function(e) { reject(e.target.error); };
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}
