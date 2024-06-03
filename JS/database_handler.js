const DB_NAME = 'YodayoChatBgandCharDB';
const DB_VERSION = 1;
const BACKGROUND_OBJECT_STORE_NAME = 'Backgrounds';
const CHARACTER_OBJECT_STORE_NAME = 'Characters';
const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();
const CHAR_ID = 'char_' + CHAT_ID;
console.log(`Chat ID: ${CHAT_ID}`);

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
            db.createObjectStore(BACKGROUND_OBJECT_STORE_NAME, { keyPath: 'CHAT_ID' });
            console.log('Created Object Store', 'backgrounds');
            db.createObjectStore(CHARACTER_OBJECT_STORE_NAME, { keyPath: 'CHAR_ID' });
            console.log('Created Object Store', 'characters');
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
export { openDatabase, saveBackgroundImage, saveCharacterImage, getBackgroundImage, getCharacterImage };
