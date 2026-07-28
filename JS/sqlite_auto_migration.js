/**
 * AUTO-MIGRATION MODULE
 * =====================
 * Automatically migrates IndexedDB to SQLite on first userscript install
 * Runs silently in background, no user interaction needed
 */

/**
 * Check if SQLite database already exists
 * @returns {Promise<boolean>}
 */
async function hasSqliteDatabase() {
    try {
        if (!window.SQL) return false;
        const db = await openSqliteDatabase();
        const result = await db.exec("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
        return result.length > 0 && result[0].values[0][0] > 0;
    } catch (error) {
        console.debug('[Auto-Migration] SQLite check:', error.message);
        return false;
    }
}

/**
 * Check if IndexedDB has data to migrate
 * @returns {Promise<boolean>}
 */
async function hasIndexedDBData() {
    try {
        const db = await openDatabase('MYChatCustomizerDB');
        const store = db.transaction('Characters').objectStore('Characters');
        
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.debug('[Auto-Migration] IndexedDB check:', error.message);
        return false;
    }
}

/**
 * Check if migration flag exists in LocalStorage
 * @returns {boolean}
 */
function hasMigrationFlag() {
    const flag = localStorage.getItem('YODAYO_CHAT_CUSTOMIZER_MIGRATED_TO_SQLITE');
    return flag === 'true';
}

/**
 * Set migration flag in LocalStorage
 */
function setMigrationFlag() {
    localStorage.setItem('YODAYO_CHAT_CUSTOMIZER_MIGRATED_TO_SQLITE', 'true');
    console.log('[Auto-Migration] ✅ Migration flag set');
}

/**
 * Perform automatic migration from IndexedDB to SQLite
 * Runs silently in background with error handling
 * @returns {Promise<boolean>} - Success/failure status
 */
async function performAutoMigration() {
    try {
        console.log('[Auto-Migration] Starting automatic migration...');

        // Step 1: Check prerequisites
        const hasSqlite = await hasSqliteDatabase();
        if (hasSqlite) {
            console.log('[Auto-Migration] ✓ SQLite database already exists, skipping');
            setMigrationFlag();
            return true;
        }

        const hasData = await hasIndexedDBData();
        if (!hasData) {
            console.log('[Auto-Migration] ℹ No IndexedDB data to migrate');
            setMigrationFlag();
            return true;
        }

        if (hasMigrationFlag()) {
            console.log('[Auto-Migration] ✓ Already migrated in previous session');
            return true;
        }

        // Step 2: Read IndexedDB data
        console.log('[Auto-Migration] Reading IndexedDB...');
        const db = await openDatabase('MYChatCustomizerDB');
        const store = db.transaction('Characters').objectStore('Characters');
        
        const characters = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (characters.length === 0) {
            console.log('[Auto-Migration] ℹ No characters found in IndexedDB');
            setMigrationFlag();
            return true;
        }

        // Step 3: Create and populate SQLite database
        console.log(`[Auto-Migration] Migrating ${characters.length} characters to SQLite...`);
        
        await initializeSqliteLib();
        const sqliteDb = await openSqliteDatabase();
        await createSqliteSchema();

        let migratedCount = 0;
        let errorCount = 0;

        for (const charRecord of characters) {
            try {
                // Insert character record
                await insertCharacter(charRecord.CHAR_ID, {
                    characterName: charRecord.characterName || '',
                    universalColors: charRecord.universalColors || {},
                    universalImages: charRecord.universalImages || {},
                    characterAlias: charRecord.characterAlias || charRecord.characterName,
                    createdAt: charRecord.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Migrate chat-specific customizations
                const chatKeys = Object.keys(charRecord.chatCustomizations || {});
                for (const chatId of chatKeys) {
                    const customization = charRecord.chatCustomizations[chatId];
                    await insertCustomization(charRecord.CHAR_ID, chatId, customization);
                }

                migratedCount++;
            } catch (error) {
                console.warn(`[Auto-Migration] Error migrating ${charRecord.CHAR_ID}:`, error.message);
                errorCount++;
            }
        }

        // Step 4: Verify migration
        const stats = getStatistics();
        console.log('[Auto-Migration] ✅ Migration complete:', {
            totalCharacters: stats.characters,
            totalCustomizations: stats.customizations,
            migratedCount,
            errorCount,
            databaseSize: stats.databaseSize
        });

        // Step 5: Create backup JSON
        const backup = await exportIndexedDBBackup();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupFilename = `YCC-pre-migration-backup-${timestamp}.json`;
        downloadIndexedDBBackup(backup, backupFilename);

        // Mark as migrated
        setMigrationFlag();
        return true;

    } catch (error) {
        console.error('[Auto-Migration] ❌ Migration failed:', error);
        
        // Fallback: Ensure flag is NOT set so user can retry
        localStorage.removeItem('YODAYO_CHAT_CUSTOMIZER_MIGRATED_TO_SQLITE');
        console.warn('[Auto-Migration] Flag cleared, user can retry migration');
        
        return false;
    }
}

/**
 * Export IndexedDB data as JSON backup
 * Used for creating safety backups during migration
 * @returns {Promise<Object>} Backup object with records
 */
async function exportIndexedDBBackup() {
    try {
        const db = await openDatabase('MYChatCustomizerDB');
        const store = db.transaction('Characters').objectStore('Characters');
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        
        const backup = {
            timestamp: new Date().toISOString(),
            source: 'IndexedDB',
            database: 'MYChatCustomizerDB',
            recordCount: records.length,
            records: records
        };
        
        return backup;
    } catch (error) {
        console.error('[Auto-Migration] Backup export failed:', error);
        throw error;
    }
}

/**
 * Download IndexedDB backup as JSON file
 * @param {Object} backup - Backup object to download
 * @param {string} filename - Name for the downloaded file
 */
function downloadIndexedDBBackup(backup, filename = 'indexeddb_backup.json') {
    try {
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('[Auto-Migration] Backup download failed:', error);
        throw error;
    }
}

/**
 * Initialize auto-migration on userscript load
 * This runs automatically when the userscript loads
 */
async function initializeAutoMigration() {
    try {
        // Give DOM time to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if already migrated
        if (hasMigrationFlag()) {
            console.log('[Auto-Migration] Already completed, skipping');
            return;
        }

        // Check if we need to migrate
        const hasData = await hasIndexedDBData();
        const hasSqlite = await hasSqliteDatabase();

        if (!hasData || hasSqlite) {
            console.log('[Auto-Migration] No action needed');
            setMigrationFlag();
            return;
        }

        // Perform migration silently
        console.log('[Auto-Migration] Auto-migration available for your data');
        const success = await performAutoMigration();

        if (success) {
            console.log('[Auto-Migration] ✅ Your IndexedDB data has been automatically migrated to SQLite');
        } else {
            console.warn('[Auto-Migration] ⚠️ Migration encountered issues. You can retry with:');
            console.warn('  await migrateIndexedDBToSqlite()');
        }

    } catch (error) {
        console.error('[Auto-Migration] Initialization error:', error);
    }
}

// Export functions for manual use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performAutoMigration,
        hasIndexedDBData,
        hasSqliteDatabase,
        hasMigrationFlag,
        setMigrationFlag,
        initializeAutoMigration
    };
}
