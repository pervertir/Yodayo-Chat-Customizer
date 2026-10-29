// image store
//
// Images (uploads, cut-outs, downloaded backgrounds) are kept as Blobs in their own object
// store, keyed by the SHA-256 of their bytes, so an image used by several chats or characters
// is stored once. Records hold a short reference (IMAGE_REF_PREFIX + hash) in place of base64,
// which keeps them small to read and lets the Tampermonkey backup keep them whole.
//
// References are shown through blob: URLs. Reading a record loads the images it refers to
// (resolveRecordImages), so normalizeImageData can turn a reference into a src synchronously.
// Images no record or snapshot refers to are deleted on startup (sweepOrphanImages).

const IMAGE_OBJECT_STORE_NAME = 'Images';
const IMAGE_REF_PREFIX = 'ycc-img:';
/** Shorter strings are never treated as embedded images */
const INLINE_IMAGE_MIN_CHARS = 1000;
/** Images stored this recently are kept by the sweep even if unreferenced (a save may be under way) */
const ORPHAN_GRACE_MS = 10 * 60 * 1000;

/** @type {Map<string, {blob: Blob, url: string}>} hash -> image loaded in this page */
const loadedImages = new Map();

/**
 * @param {*} value
 * @returns {boolean}
 */
function isImageRef(value) {
    return typeof value === 'string' && value.startsWith(IMAGE_REF_PREFIX);
}

/**
 * blob: URL of a loaded image reference ('' if it isn't loaded).
 * @param {string} ref
 * @returns {string}
 */
function imageRefUrl(ref) {
    const image = loadedImages.get(ref.slice(IMAGE_REF_PREFIX.length));
    if (!image) console.warn('Image not loaded:', ref);
    return image ? image.url : '';
}

/**
 * The stored Blob behind a blob: URL made by this store, if any.
 * @param {string} url
 * @returns {Blob|null}
 */
function loadedImageBlob(url) {
    for (const image of loadedImages.values()) if (image.url === url) return image.blob;
    return null;
}

/**
 * MIME type from an image's first bytes, or null if it isn't a known image format.
 * @param {Uint8Array} bytes
 * @returns {string|null}
 */
function sniffImageType(bytes) {
    const ascii = (start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
    if (bytes[0] === 0x89 && ascii(1, 3) === 'PNG') return 'image/png';
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
    if (ascii(0, 4) === 'GIF8') return 'image/gif';
    if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
    if (ascii(4, 4) === 'ftyp' && ascii(8, 4).startsWith('avi')) return 'image/avif';
    return null;
}

/**
 * Decodes an embedded image (raw base64 or a base64 data: URL) to a Blob.
 * @param {*} value
 * @returns {Blob|null} null if the value isn't an embedded image
 */
function inlineImageToBlob(value) {
    if (typeof value !== 'string' || value.length < INLINE_IMAGE_MIN_CHARS) return null;
    let data = value;
    if (value.startsWith('data:')) {
        const comma = value.indexOf(',');
        if (!value.startsWith('data:image/') || !value.slice(0, comma).includes(';base64')) return null;
        data = value.slice(comma + 1);
    } else if (/^https?:/.test(value)) {
        return null;
    }
    let binary;
    try {
        binary = atob(data);
    } catch (e) {
        return null; // not base64
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const type = sniffImageType(bytes);
    return type ? new Blob([bytes], { type }) : null;
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>} hex SHA-256 of the bytes
 */
async function hashBlob(blob) {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Remembers a stored image for display in this page.
 * @param {string} hash
 * @param {Blob} blob
 */
function rememberImage(hash, blob) {
    if (!loadedImages.has(hash)) loadedImages.set(hash, { blob, url: URL.createObjectURL(blob) });
}

/**
 * Stores images (once each) and returns their references.
 * @param {Blob[]} blobs
 * @returns {Promise<string[]>}
 */
async function putImages(blobs) {
    const hashes = await Promise.all(blobs.map(hashBlob));
    if (!db) await openDatabase();
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(IMAGE_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(IMAGE_OBJECT_STORE_NAME);
        // Put even if it exists: refreshes `stored`, so the sweep can't delete an image being reused
        blobs.forEach((blob, i) => objectStore.put({ hash: hashes[i], blob, type: blob.type, size: blob.size, stored: Date.now() }));
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target.error);
        transaction.onabort = (e) => reject(transaction.error || e.target.error);
    });
    blobs.forEach((blob, i) => rememberImage(hashes[i], blob));
    return hashes.map(hash => IMAGE_REF_PREFIX + hash);
}

/**
 * Copy of a record with embedded images moved to the image store.
 * @template {Object} T
 * @param {T} record
 * @returns {Promise<T>}
 */
async function storeInlineImages(record) {
    const inline = Object.entries(record)
        .map(([key, value]) => [key, inlineImageToBlob(value)])
        .filter(([, blob]) => blob);
    if (!inline.length) return record;
    const refs = await putImages(inline.map(([, blob]) => blob));
    const copy = { ...record };
    inline.forEach(([key], i) => { copy[key] = refs[i]; });
    return copy;
}

/**
 * @param {Object[]} records
 * @returns {Set<string>} hashes of every image the records refer to
 */
function collectImageHashes(records) {
    const hashes = new Set();
    records.forEach(record => record && Object.values(record).forEach(value => {
        if (isImageRef(value)) hashes.add(value.slice(IMAGE_REF_PREFIX.length));
    }));
    return hashes;
}

/**
 * Loads the images the records refer to, so their references can be shown.
 * @param {(Object|null)[]} records
 * @returns {Promise<void>}
 */
async function resolveRecordImages(records) {
    const missing = [...collectImageHashes(records)].filter(hash => !loadedImages.has(hash));
    if (!missing.length) return;
    const found = await getStoredImages(missing);
    found.forEach(image => rememberImage(image.hash, image.blob));
}

/**
 * @param {string[]} hashes
 * @returns {Promise<{hash: string, blob: Blob}[]>} the ones that exist
 */
function getStoredImages(hashes) {
    return new Promise((resolve, reject) => {
        const objectStore = db.transaction(IMAGE_OBJECT_STORE_NAME, 'readonly').objectStore(IMAGE_OBJECT_STORE_NAME);
        const found = [];
        hashes.forEach(hash => {
            objectStore.get(hash).onsuccess = (e) => { if (e.target.result) found.push(e.target.result); };
        });
        objectStore.transaction.oncomplete = () => resolve(found);
        objectStore.transaction.onerror = (e) => reject(e.target.error);
    });
}

/**
 * @returns {Promise<{hash: string, stored: number}[]>} every stored image's key and store time
 */
function listStoredImages() {
    return new Promise((resolve, reject) => {
        const images = [];
        const request = db.transaction(IMAGE_OBJECT_STORE_NAME, 'readonly')
            .objectStore(IMAGE_OBJECT_STORE_NAME).openCursor();
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (!cursor) return resolve(images);
            images.push({ hash: cursor.value.hash, stored: cursor.value.stored });
            cursor.continue();
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Moves images still embedded in records (saved by older versions, imports, restores) to the
 * image store, and drops references to images that no longer exist (e.g. after site data was
 * cleared and settings came back from the Tampermonkey backup without them).
 * @param {CharacterRecord[]} records
 * @returns {Promise<CharacterRecord[]>} the records as stored afterwards
 */
async function migrateRecordImages(records) {
    const stored = new Set((await listStoredImages()).map(image => image.hash));
    // Images still open in this page (the database was cleared under it) are stored again
    const reloadable = [...loadedImages.keys()].filter(hash => !stored.has(hash));
    if (reloadable.length) {
        await putImages(reloadable.map(hash => loadedImages.get(hash).blob));
        reloadable.forEach(hash => stored.add(hash));
    }
    const changed = [];
    const result = [];
    for (const record of records) {
        let updated = await storeInlineImages(record);
        const dangling = Object.keys(updated).filter(key =>
            isImageRef(updated[key]) && !stored.has(updated[key].slice(IMAGE_REF_PREFIX.length)) &&
            !loadedImages.has(updated[key].slice(IMAGE_REF_PREFIX.length))); // just stored by storeInlineImages
        if (dangling.length) {
            updated = { ...updated };
            dangling.forEach(key => delete updated[key]);
            console.warn(`Dropped missing images from ${record.CHAR_ID}:`, dangling);
        }
        if (updated !== record) changed.push(updated);
        result.push(updated);
    }
    if (changed.length) {
        await writeRecords(changed, false);
        console.log(`Moved images of ${changed.length} records to the image store`);
    }
    return result;
}

/**
 * Deletes stored images that no record and no backup snapshot refers to.
 * @param {CharacterRecord[]} records
 * @returns {Promise<number>} number of deleted images
 */
async function sweepOrphanImages(records) {
    const snapshotRecords = listSnapshots().flatMap(s => getSnapshot(s.key)?.records || []);
    const referenced = collectImageHashes([...records, ...snapshotRecords]);
    const cutoff = Date.now() - ORPHAN_GRACE_MS;
    const orphans = (await listStoredImages())
        .filter(image => !referenced.has(image.hash) && !(image.stored > cutoff))
        .map(image => image.hash);
    if (!orphans.length) return 0;
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(IMAGE_OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(IMAGE_OBJECT_STORE_NAME);
        orphans.forEach(hash => objectStore.delete(hash));
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target.error);
    });
    orphans.forEach(hash => {
        const image = loadedImages.get(hash);
        if (image) URL.revokeObjectURL(image.url);
        loadedImages.delete(hash);
    });
    console.log(`Deleted ${orphans.length} unused images`);
    return orphans.length;
}

/**
 * The images the records refer to, for a JSON export.
 * @param {CharacterRecord[]} records
 * @returns {Promise<Object<string, string>>} hash -> data: URL
 */
async function exportRecordImages(records) {
    const images = {};
    for (const image of await getStoredImages([...collectImageHashes(records)])) {
        images[image.hash] = await blobToDataUrl(image.blob);
    }
    return images;
}

/**
 * Stores the images of a JSON export.
 * @param {Object<string, string>} images - hash -> data: URL
 * @returns {Promise<string[]>} errors
 */
async function importRecordImages(images) {
    const errors = [];
    for (const [hash, dataUrl] of Object.entries(images || {})) {
        const blob = inlineImageToBlob(dataUrl);
        if (!blob) {
            errors.push(`Image ${hash.slice(0, 12)}: not a valid image`);
            continue;
        }
        const [ref] = await putImages([blob]);
        if (ref !== IMAGE_REF_PREFIX + hash) errors.push(`Image ${hash.slice(0, 12)}: contents don't match its name`);
    }
    return errors;
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
