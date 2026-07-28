/**
 * SQLite Database Handler using sql.js (WebAssembly SQLite)
 * Provides export/import functionality with binary .sqlite files
 * Compatible with all modern browsers (Chrome, Firefox, Safari, Edge, etc.)
 */

let sqliteDb = null;
let SQL = null;

/**
 * Initialize SQL.js library
 * Must be called before any SQLite operations
 */
async function initializeSqliteLib() {
    if (SQL) return SQL;
    
    try {
        // initSqlJs is globally available from CDN script
        SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.1/${file}`
        });
        console.log('✓ SQL.js library initialized');
        return SQL;
    } catch (error) {
        console.error('✗ Failed to initialize SQL.js:', error);
        throw error;
    }
}

/**
 * Create or open SQLite database
 * @param {Uint8Array|null} data - Optional existing database binary data
 */
async function openSqliteDatabase(data = null) {
    if (!SQL) await initializeSqliteLib();
    
    try {
        if (data instanceof Uint8Array) {
            sqliteDb = new SQL.Database(data);
            console.log('✓ Opened existing SQLite database');
        } else {
            sqliteDb = new SQL.Database();
            createSqliteSchema();
            console.log('✓ Created new SQLite database');
        }
        return sqliteDb;
    } catch (error) {
        console.error('✗ Failed to open SQLite database:', error);
        throw error;
    }
}

/**
 * Create database schema with all required tables
 */
function createSqliteSchema() {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        
        // Characters table
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS ${schema.characters.name} (
                ${schema.characters.columns}
            )
        `);
        
        // Character Customizations table
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS ${schema.characterCustomizations.name} (
                ${schema.characterCustomizations.columns}
            )
        `);
        
        // Universal Settings table
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS ${schema.universalSettings.name} (
                ${schema.universalSettings.columns}
            )
        `);
        
        // Metadata table
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS ${schema.metadata.name} (
                ${schema.metadata.columns}
            )
        `);
        
        // Create indexes for performance
        sqliteDb.run(`
            CREATE INDEX IF NOT EXISTS idx_char_customizations_char_id 
            ON CharacterCustomizations(CHAR_ID)
        `);
        sqliteDb.run(`
            CREATE INDEX IF NOT EXISTS idx_char_customizations_chat_id 
            ON CharacterCustomizations(CHAT_ID)
        `);
        
        // Store schema version and export timestamp
        sqliteDb.run(
            `INSERT OR REPLACE INTO ${schema.metadata.name} (KEY, VALUE) VALUES (?, ?)`,
            ['schema_version', SQLITE_CONFIG.version]
        );
        sqliteDb.run(
            `INSERT OR REPLACE INTO ${schema.metadata.name} (KEY, VALUE) VALUES (?, ?)`,
            ['created_at', new Date().toISOString()]
        );
        
        console.log('✓ SQLite schema created successfully');
    } catch (error) {
        console.error('✗ Failed to create SQLite schema:', error);
        throw error;
    }
}

/**
 * Migrate data from IndexedDB to SQLite
 * @param {Array} characters - Character records from IndexedDB
 */
async function migrateFromIndexedDB(characters) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        let migratedCount = 0;
        
        // Start transaction for performance
        sqliteDb.run('BEGIN TRANSACTION');
        
        for (const record of characters) {
            // Insert character
            sqliteDb.run(
                `INSERT OR IGNORE INTO ${schema.characters.name} (CHAR_ID, NAME) VALUES (?, ?)`,
                [record.CHAR_ID, record.characterName || 'Unknown']
            );
            
            // Insert character customizations
            if (record.colors || record.images || record.alias) {
                sqliteDb.run(
                    `INSERT INTO ${schema.characterCustomizations.name} 
                    (CHAR_ID, COLOR_DATA, IMAGE_DATA, ALIAS) VALUES (?, ?, ?, ?)`,
                    [
                        record.CHAR_ID,
                        JSON.stringify(record.colors || {}),
                        JSON.stringify(record.images || {}),
                        record.alias || null
                    ]
                );
            }
            
            // Insert chat-specific customizations if present
            if (record.chatCustomizations) {
                for (const [chatId, customization] of Object.entries(record.chatCustomizations)) {
                    sqliteDb.run(
                        `INSERT INTO ${schema.characterCustomizations.name} 
                        (CHAR_ID, CHAT_ID, COLOR_DATA, IMAGE_DATA, ALIAS) VALUES (?, ?, ?, ?, ?)`,
                        [
                            record.CHAR_ID,
                            chatId,
                            JSON.stringify(customization.colors || {}),
                            JSON.stringify(customization.images || {}),
                            customization.alias || null
                        ]
                    );
                }
            }
            
            migratedCount++;
        }
        
        sqliteDb.run('COMMIT');
        console.log(`✓ Migrated ${migratedCount} characters to SQLite`);
        return migratedCount;
    } catch (error) {
        sqliteDb.run('ROLLBACK');
        console.error('✗ Migration failed:', error);
        throw error;
    }
}

/**
 * Insert or update character record
 * @param {string} charId - Character ID
 * @param {Object} data - Character data
 */
function insertCharacter(charId, data) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        sqliteDb.run(
            `INSERT OR REPLACE INTO ${schema.characters.name} (CHAR_ID, NAME) VALUES (?, ?)`,
            [charId, data.name || 'Unknown']
        );
    } catch (error) {
        console.error('✗ Failed to insert character:', error);
        throw error;
    }
}

/**
 * Insert customization for character/chat combo
 * @param {string} charId - Character ID
 * @param {string} chatId - Chat ID (null for universal)
 * @param {Object} customization - Color and image data
 */
function insertCustomization(charId, chatId, customization) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        sqliteDb.run(
            `INSERT OR REPLACE INTO ${schema.characterCustomizations.name} 
            (CHAR_ID, CHAT_ID, COLOR_DATA, IMAGE_DATA, ALIAS) VALUES (?, ?, ?, ?, ?)`,
            [
                charId,
                chatId || null,
                JSON.stringify(customization.colors || {}),
                JSON.stringify(customization.images || {}),
                customization.alias || null
            ]
        );
    } catch (error) {
        console.error('✗ Failed to insert customization:', error);
        throw error;
    }
}

/**
 * Query character by ID
 * @param {string} charId - Character ID
 * @returns {Object|null} Character record or null
 */
function getCharacter(charId) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        const result = sqliteDb.exec(
            `SELECT * FROM ${schema.characters.name} WHERE CHAR_ID = ?`,
            [charId]
        );
        
        if (result.length === 0) return null;
        
        const columns = result[0].columns;
        const values = result[0].values[0];
        
        return columns.reduce((obj, col, idx) => {
            obj[col] = values[idx];
            return obj;
        }, {});
    } catch (error) {
        console.error('✗ Failed to get character:', error);
        return null;
    }
}

/**
 * Query customization for character/chat combo
 * @param {string} charId - Character ID
 * @param {string} chatId - Chat ID (null for universal)
 * @returns {Object|null} Customization record or null
 */
function getCustomization(charId, chatId) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        const result = sqliteDb.exec(
            `SELECT * FROM ${schema.characterCustomizations.name} 
            WHERE CHAR_ID = ? AND (CHAT_ID = ? OR CHAT_ID IS NULL)
            ORDER BY CHAT_ID DESC LIMIT 1`,
            [charId, chatId || null]
        );
        
        if (result.length === 0) return null;
        
        const columns = result[0].columns;
        const values = result[0].values[0];
        
        const record = columns.reduce((obj, col, idx) => {
            obj[col] = values[idx];
            return obj;
        }, {});
        
        // Parse JSON fields
        record.colors = record.COLOR_DATA ? JSON.parse(record.COLOR_DATA) : {};
        record.images = record.IMAGE_DATA ? JSON.parse(record.IMAGE_DATA) : {};
        record.alias = record.ALIAS;
        
        return record;
    } catch (error) {
        console.error('✗ Failed to get customization:', error);
        return null;
    }
}

/**
 * Query all characters
 * @returns {Array} Array of character records
 */
function getAllCharacters() {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        const result = sqliteDb.exec(`SELECT * FROM ${schema.characters.name}`);
        
        if (result.length === 0) return [];
        
        const columns = result[0].columns;
        return result[0].values.map(values => {
            return columns.reduce((obj, col, idx) => {
                obj[col] = values[idx];
                return obj;
            }, {});
        });
    } catch (error) {
        console.error('✗ Failed to get all characters:', error);
        return [];
    }
}

/**
 * Delete character and all customizations
 * @param {string} charId - Character ID
 */
function deleteCharacter(charId) {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const { schema } = SQLITE_CONFIG;
        sqliteDb.run('BEGIN TRANSACTION');
        
        sqliteDb.run(
            `DELETE FROM ${schema.characterCustomizations.name} WHERE CHAR_ID = ?`,
            [charId]
        );
        sqliteDb.run(
            `DELETE FROM ${schema.characters.name} WHERE CHAR_ID = ?`,
            [charId]
        );
        
        sqliteDb.run('COMMIT');
        console.log(`✓ Deleted character: ${charId}`);
    } catch (error) {
        sqliteDb.run('ROLLBACK');
        console.error('✗ Failed to delete character:', error);
        throw error;
    }
}

/**
 * Export SQLite database as binary file
 * @returns {Uint8Array} SQLite database binary
 */
function exportSqliteDatabase() {
    if (!sqliteDb) throw new Error('Database not initialized');
    
    try {
        const binaryArray = sqliteDb.export();
        console.log(`✓ Exported SQLite database (${(binaryArray.length / 1024).toFixed(2)} KB)`);
        return binaryArray;
    } catch (error) {
        console.error('✗ Failed to export SQLite database:', error);
        throw error;
    }
}

/**
 * Export SQLite database as downloadable file
 * @param {string} filename - Output filename (default: yodayo_customizer.sqlite)
 */
function downloadSqliteDatabase(filename = SQLITE_CONFIG.databaseName) {
    try {
        const binaryArray = exportSqliteDatabase();
        const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✓ Downloaded SQLite database as ${filename}`);
    } catch (error) {
        console.error('✗ Failed to download SQLite database:', error);
        throw error;
    }
}

/**
 * Import SQLite database from file
 * @param {File} file - SQLite file to import
 */
async function importSqliteDatabase(file) {
    try {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        await openSqliteDatabase(uint8Array);
        console.log(`✓ Imported SQLite database from ${file.name}`);
        return true;
    } catch (error) {
        console.error('✗ Failed to import SQLite database:', error);
        throw error;
    }
}

/**
 * Get database statistics
 * @returns {Object} Database stats
 */
function getStatistics() {
    if (!sqliteDb) return null;
    
    try {
        const { schema } = SQLITE_CONFIG;
        
        const charCount = sqliteDb.exec(`SELECT COUNT(*) as count FROM ${schema.characters.name}`);
        const customCount = sqliteDb.exec(`SELECT COUNT(*) as count FROM ${schema.characterCustomizations.name}`);
        
        const charTotal = charCount[0]?.values[0]?.[0] || 0;
        const customTotal = customCount[0]?.values[0]?.[0] || 0;
        
        const binarySize = sqliteDb.export().length;
        
        return {
            characters: charTotal,
            customizations: customTotal,
            databaseSize: `${(binarySize / 1024).toFixed(2)} KB`,
            databaseSizeBytes: binarySize
        };
    } catch (error) {
        console.error('✗ Failed to get statistics:', error);
        return null;
    }
}

/**
 * Close database connection
 */
function closeSqliteDatabase() {
    if (sqliteDb) {
        sqliteDb.close();
        sqliteDb = null;
        console.log('✓ SQLite database closed');
    }
}
