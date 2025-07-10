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
            // Create the Characters object store with CHAR_ID as the key path
            const objectStore = db.createObjectStore('Characters', { keyPath: 'CHAR_ID' });

            // Define the attributes and set default values to null
            objectStore.createIndex('chat_ids', 'chat_ids', { unique: false }); // changed
            objectStore.createIndex('apply_to_all', 'apply_to_all', { unique: false }); // changed
            objectStore.createIndex('exclude_chat_ids', 'exclude_chat_ids', { unique: false });
            objectStore.createIndex('background_image', 'background_image', { unique: false });
            objectStore.createIndex('character_alias', 'character_alias', { unique: false });
            objectStore.createIndex('character_name_color', 'character_name_color', { unique: false });
            objectStore.createIndex('character_image', 'character_image', { unique: false });
            objectStore.createIndex('default_background_image', 'default_background_image', { unique: false }); // Added index for default_character_image
            objectStore.createIndex('character_narration_color', 'character_narration_color', { unique: false });
            objectStore.createIndex('character_message_color', 'character_message_color', { unique: false });
            objectStore.createIndex('character_message_box_color', 'character_message_box_color', { unique: false });
            objectStore.createIndex('username_color', 'username_color', { unique: false });
            objectStore.createIndex('user_message_color', 'user_message_color', { unique: false });
            objectStore.createIndex('user_message_box_color', 'user_message_box_color', { unique: false });

            console.log('Object store and indexes created');
        };
    });
}

/**
 * @template {keyof CharacterRecord} K
 * @param {string} CHAR_ID
 * @param {K} field
 * @param {CharacterRecord[K] | null} value // Accept string | null
 * @returns {Promise<void>}
 */
async function saveCharacterField(CHAR_ID, field, value) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            record[field] = value;
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
 * @param {string} CHAR_ID
 * @param {string|null} imageBase64
 * @returns {Promise<void>}
 */
async function saveBackgroundImage(CHAR_ID, imageBase64) {
    return saveCharacterField(CHAR_ID, 'background_image', imageBase64);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} imageBase64
 * @returns {Promise<void>}
 */
async function saveCharacterImage(CHAR_ID, imageBase64) {
    return saveCharacterField(CHAR_ID, 'character_image', imageBase64);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} alias
 * @returns {Promise<void>}
 */
async function saveCharacterAlias(CHAR_ID, alias) {
    return saveCharacterField(CHAR_ID, 'character_alias', alias);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveCharacterNameColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'character_name_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveCharacterNarrationColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'character_narration_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveCharacterMessageColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'character_message_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveCharacterMessageBoxColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'character_message_box_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveUsernameColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'username_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveUserMessageColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'user_message_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} color
 * @returns {Promise<void>}
 */
async function saveUserMessageBoxColor(CHAR_ID, color) {
    return saveCharacterField(CHAR_ID, 'user_message_box_color', color);
}
/**
 * @param {string} CHAR_ID
 * @param {string|null} imageBase64
 * @returns {Promise<void>}
 */
async function saveDefaultBackgroundImage(CHAR_ID, imageBase64) {
    return saveCharacterField(CHAR_ID, 'default_background_image', imageBase64);
}
/**
 * @param {string} CHAR_ID
 * @returns {Promise<string|null>}
 */
async function getDefaultBackgroundImage(CHAR_ID) {
    return getCharacterField(CHAR_ID, 'default_background_image');
}

/**
 * Adds a chat ID to exclude_chat_ids and ensures it is removed from chat_ids.
 * @param {string} CHAR_ID
 * @param {string} CHAT_ID
 * @returns {Promise<void>}
 */
async function excludeChatIdForCharacter(CHAR_ID, CHAT_ID) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            // Add to exclude_chat_ids if not present
            if (!Array.isArray(record.exclude_chat_ids)) {
                record.exclude_chat_ids = [];
            }
            if (!record.exclude_chat_ids.includes(CHAT_ID)) {
                record.exclude_chat_ids.push(CHAT_ID);
            }
            // Remove from chat_ids if present
            if (Array.isArray(record.chat_ids)) {
                record.chat_ids = record.chat_ids.filter(id => id !== CHAT_ID);
            }
            const putRequest = objectStore.put(record);
            putRequest.onsuccess = function() { resolve(); };
            putRequest.onerror = function(e) { reject(e.target.error); };
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}

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
 * Saves universal color settings (applies to all characters/chats).
 * Only color fields are stored, not image/bg/character name.
 * @param {Object} colorSettings - An object with color fields (see below).
 * @returns {Promise<void>}
 *
 * Example colorSettings:
 * {
 *   character_name_color: string|null,
 *   character_narration_color: string|null,
 *   character_message_color: string|null,
 *   character_message_box_color: string|null,
 *   username_color: string|null,
 *   user_message_color: string|null,
 *   user_message_box_color: string|null
 * }
 */
async function saveUniversalColorSettings(colorSettings) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        // Only store color fields
        const universalRecord = { CHAR_ID: 'Universal', ...colorSettings };
        const putRequest = objectStore.put(universalRecord);
        putRequest.onsuccess = function() { resolve(); };
        putRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * Loads universal color settings (returns only color fields, not image/bg/name).
 * @returns {Promise<Object|null>} An object with color fields or null if not set.
 */
async function getUniversalColorSettings() {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get('Universal');
        getRequest.onsuccess = function(event) {
            const record = event.target.result;
            if (!record) return resolve(null);
            // Only return color fields
            const {
                character_name_color,
                character_narration_color,
                character_message_color,
                character_message_box_color,
                username_color,
                user_message_color,
                user_message_box_color
            } = record;
            resolve({
                character_name_color,
                character_narration_color,
                character_message_color,
                character_message_box_color,
                username_color,
                user_message_color,
                user_message_box_color
            });
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}

/**
 * Saves multiple character fields in a single transaction for better performance.
 * Only updates the provided fields, preserving existing data.
 * @param {string} CHAR_ID
 * @param {Partial<CharacterRecord>} fields - Object containing the fields to update
 * @returns {Promise<void>}
 */
async function saveCharacterFieldsBatch(CHAR_ID, fields) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        
        getRequest.onsuccess = function(event) {
            /** @type {CharacterRecord} */
            let record = event.target.result || { CHAR_ID };
            
            // Only update fields that have actual values (not null/undefined)
            Object.keys(fields).forEach(field => {
                const value = fields[field];
                if (value !== null && value !== undefined) {
                    record[field] = value;
                }
                // Don't overwrite existing values with null/undefined
            });
            
            const putRequest = objectStore.put(record);
            putRequest.onsuccess = function() { resolve(); };
            putRequest.onerror = function(e) { reject(e.target.error); };
        };
        getRequest.onerror = function(e) { reject(e.target.error); };
    });
}
