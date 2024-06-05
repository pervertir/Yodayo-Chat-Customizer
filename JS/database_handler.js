// database handler
const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();

console.log('Chat ID: ', CHAT_ID);

function findCharacterID() {
    // Select the anchor element
    
    const anchorElement = document.querySelector('.flex.items-end.gap-2.mr-3 > a');

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
            objectStore.createIndex('character_alias', 'character_alias', { unique: false });
            objectStore.createIndex('chat_ids', 'chat_ids', { unique: false });
            objectStore.createIndex('exclude_chat_ids', 'exclude_chat_ids', { unique: false });
            objectStore.createIndex('character_image', 'character_image', { unique: false });
            objectStore.createIndex('background_image', 'background_image', { unique: false });
            objectStore.createIndex('character_message_box_color', 'character_message_box_color', { unique: false });
            objectStore.createIndex('character_narration_color', 'character_narration_color', { unique: false });
            objectStore.createIndex('character_message_color', 'character_message_color', { unique: false });
            objectStore.createIndex('character_name_color', 'character_name_color', { unique: false });
            objectStore.createIndex('username_color', 'username_color', { unique: false });
            objectStore.createIndex('user_message_color', 'user_message_color', { unique: false });
            objectStore.createIndex('user_message_box_color', 'user_message_box_color', { unique: false });

            console.log('Object store and indexes created');
        };
    });
}

async function saveBackgroundImage(CHAT_ID, imageBase64) {
    if (!db) {
        await openDatabase();
    }

    const transaction = db.transaction(BACKGROUND_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(BACKGROUND_OBJECT_STORE_NAME);
    objectStore.put({ CHAT_ID, imageBase64 });
}

async function saveCharacterImage(CHAR_ID, imageBase64) {
    if (!db) {
        await openDatabase();
    }

    const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
    objectStore.put({ CHAR_ID, imageBase64 });
}

async function getBackgroundImage(CHAT_ID) {
    if (!db) {
        await openDatabase();
    }

    const transaction = db.transaction(BACKGROUND_OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(BACKGROUND_OBJECT_STORE_NAME);
    const request = objectStore.get(CHAT_ID);

    return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                resolve(result.imageBase64);
            } else {
                resolve(null);
            }
        };

        request.onerror = (event) => {
            console.error('Failed to get image:', event.target.error);
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
            if (result) {
                resolve(result.imageBase64);
            } else {
                resolve(null);
            }
        };

        request.onerror = (event) => {
            console.error('Failed to get image:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Exporting functions
// export { openDatabase, saveBackgroundImage, saveCharacterImage, getBackgroundImage, getCharacterImage };
