// database handler
const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();

console.log('Chat ID: ', CHAT_ID);

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
            objectStore.createIndex('chat_ids', 'chat_ids', { unique: true });
            objectStore.createIndex('apply_to_all', 'apply_to_all', { unique: true });
            objectStore.createIndex('exclude_chat_ids', 'exclude_chat_ids', { unique: false });
            objectStore.createIndex('background_image', 'background_image', { unique: false });
            objectStore.createIndex('character_alias', 'character_alias', { unique: false });
            objectStore.createIndex('character_name_color', 'character_name_color', { unique: false });
            objectStore.createIndex('character_image', 'character_image', { unique: false });
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

async function saveBackgroundImage(CHAR_ID, imageBase64) {
    if (!db) {
        await openDatabase();
    }
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    // Get existing record, update only background_image
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.background_image = imageBase64;
        const putRequest = objectStore.put(record);
        putRequest.onerror = function(e) {
            console.error('Failed to save background image:', e.target.error);
        };
    };
    getRequest.onerror = function(e) {
        console.error('Failed to get record for background image:', e.target.error);
    };
}

async function saveCharacterImage(CHAR_ID, imageBase64) {
    if (!db) {
        await openDatabase();
    }
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    // Get existing record, update only character_image
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_image = imageBase64;
        const putRequest = objectStore.put(record);
        putRequest.onerror = function(e) {
            console.error('Failed to save character image:', e.target.error);
        };
    };
    getRequest.onerror = function(e) {
        console.error('Failed to get record for character image:', e.target.error);
    };
}

async function getBackgroundImage(CHAR_ID) {
    if (!db) {
        await openDatabase();
    }
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result && result.background_image) {
                resolve(result.background_image);
            } else {
                resolve(null);
            }
        };
        request.onerror = (event) => {
            console.error('Failed to get background image:', event.target.error);
            reject(event.target.error);
        };
    });
}

async function getCharacterImage(CHAR_ID) {
    if (!db) {
        await openDatabase();
    }
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result && result.character_image) {
                resolve(result.character_image);
            } else {
                resolve(null);
            }
        };
        request.onerror = (event) => {
            console.error('Failed to get character image:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Save and get for each index
async function saveCharacterAlias(CHAR_ID, alias) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_alias = alias;
        objectStore.put(record);
    };
}
async function getCharacterAlias(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.character_alias ? result.character_alias : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveCharacterNameColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_name_color = color;
        objectStore.put(record);
    };
}
async function getCharacterNameColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.character_name_color ? result.character_name_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveCharacterNarrationColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_narration_color = color;
        objectStore.put(record);
    };
}
async function getCharacterNarrationColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.character_narration_color ? result.character_narration_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveCharacterMessageColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_message_color = color;
        objectStore.put(record);
    };
}
async function getCharacterMessageColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.character_message_color ? result.character_message_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveCharacterMessageBoxColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.character_message_box_color = color;
        objectStore.put(record);
    };
}
async function getCharacterMessageBoxColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.character_message_box_color ? result.character_message_box_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveUsernameColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.username_color = color;
        objectStore.put(record);
    };
}
async function getUsernameColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.username_color ? result.username_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveUserMessageColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.user_message_color = color;
        objectStore.put(record);
    };
}
async function getUserMessageColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.user_message_color ? result.user_message_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function saveUserMessageBoxColor(CHAR_ID, color) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        record.user_message_box_color = color;
        objectStore.put(record);
    };
}
async function getUserMessageBoxColor(CHAR_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAR_ID);
    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result && result.user_message_box_color ? result.user_message_box_color : null);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

// Ensure current CHAT_ID is stored in chat_ids array for CHAR_ID
async function ensureChatIdForCharacter(CHAR_ID, CHAT_ID) {
    if (!db) await openDatabase();
    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    const getRequest = objectStore.get(CHAR_ID);
    getRequest.onsuccess = function(event) {
        let record = event.target.result || { CHAR_ID };
        if (!Array.isArray(record.chat_ids)) {
            record.chat_ids = [];
        }
        if (!record.chat_ids.includes(CHAT_ID)) {
            record.chat_ids.push(CHAT_ID);
            objectStore.put(record);
        }
    };
    getRequest.onerror = function(e) {
        console.error('Failed to get record for chat_ids:', e.target.error);
    };
}
