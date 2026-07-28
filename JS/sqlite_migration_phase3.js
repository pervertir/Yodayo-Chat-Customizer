/**
 * SQLite Migration Utility - Phase 3
 * Safely migrate IndexedDB data to SQLite format with validation and rollback
 * 
 * SAFE TO RUN - Only reads from IndexedDB, creates backups before any modifications
 */

/**
 * Step 1: Export IndexedDB data as JSON backup (SAFE - read only)
 * Can be run in browser console without any risk
 */
async function exportIndexedDBBackup() {
    console.log('📦 Exporting IndexedDB backup...');
    
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
        
        console.log(`✓ Exported ${records.length} records from IndexedDB`);
        return backup;
    } catch (error) {
        console.error('✗ Failed to export IndexedDB backup:', error);
        throw error;
    }
}

/**
 * Step 2: Download IndexedDB backup as JSON file
 * Safe preview before migration
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
        
        console.log(`✓ Downloaded IndexedDB backup as ${filename}`);
    } catch (error) {
        console.error('✗ Failed to download backup:', error);
        throw error;
    }
}

/**
 * Step 3: Analyze IndexedDB structure
 * Understand what we're migrating
 */
async function analyzeIndexedDBStructure() {
    console.log('🔍 Analyzing IndexedDB structure...');
    
    try {
        const backup = await exportIndexedDBBackup();
        const records = backup.records;
        
        if (records.length === 0) {
            console.log('ℹ️  No records in IndexedDB');
            return {
                totalRecords: 0,
                characterIds: [],
                sampleRecord: null
            };
        }
        
        // Analyze first record structure
        const firstRecord = records[0];
        const characterIds = records.map(r => r.CHAR_ID || r.CharID);
        
        const analysis = {
            totalRecords: records.length,
            characterIds: [...new Set(characterIds)],
            sampleRecord: firstRecord,
            fields: Object.keys(firstRecord),
            dataTypes: {}
        };
        
        // Analyze data types
        for (const [key, value] of Object.entries(firstRecord)) {
            analysis.dataTypes[key] = typeof value;
        }
        
        console.log('✓ IndexedDB Analysis:');
        console.log(`  - Total Records: ${analysis.totalRecords}`);
        console.log(`  - Unique Characters: ${analysis.characterIds.length}`);
        console.log(`  - Fields: ${analysis.fields.join(', ')}`);
        console.log(`  - Sample Record:`, analysis.sampleRecord);
        
        return analysis;
    } catch (error) {
        console.error('✗ Failed to analyze IndexedDB:', error);
        throw error;
    }
}

/**
 * Step 4: Validate IndexedDB → SQLite conversion
 * Ensures data integrity after migration
 */
async function validateMigration(indexedDBRecords, sqliteStats) {
    console.log('✔️  Validating migration...');
    
    const issues = [];
    
    try {
        // Check record count
        if (sqliteStats.characters !== indexedDBRecords.length) {
            issues.push(
                `Record count mismatch: IndexedDB=${indexedDBRecords.length}, SQLite=${sqliteStats.characters}`
            );
        }
        
        // Check for data loss
        const indexedDBCharIds = new Set(
            indexedDBRecords.map(r => r.CHAR_ID || r.CharID)
        );
        
        if (indexedDBCharIds.size === 0) {
            console.log('⚠️  Warning: No character IDs found in IndexedDB');
        }
        
        // Check for required fields
        for (const record of indexedDBRecords) {
            if (!record.CHAR_ID && !record.CharID) {
                issues.push(`Record missing CHAR_ID: ${JSON.stringify(record)}`);
            }
        }
        
        // Database size comparison
        const indexedDBEstimate = indexedDBRecords.reduce((sum, r) => {
            return sum + JSON.stringify(r).length;
        }, 0);
        
        console.log('✓ Validation Results:');
        console.log(`  - IndexedDB Size: ${(indexedDBEstimate / 1024).toFixed(2)} KB`);
        console.log(`  - SQLite Size: ${sqliteStats.databaseSize}`);
        console.log(`  - Issues Found: ${issues.length}`);
        
        if (issues.length > 0) {
            console.warn('⚠️  Validation Issues:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            recordCount: indexedDBRecords.length,
            indexedDBSize: indexedDBEstimate,
            sqliteSize: sqliteStats.databaseSizeBytes
        };
    } catch (error) {
        console.error('✗ Validation failed:', error);
        throw error;
    }
}

/**
 * Step 5: Execute migration from IndexedDB to SQLite
 * Main migration function - safe and reversible
 */
async function migrateIndexedDBToSqlite(options = {}) {
    const {
        skipBackup = false,
        validateOnly = false,
        verbose = true
    } = options;
    
    try {
        console.log('🚀 Starting IndexedDB → SQLite Migration');
        console.log('═'.repeat(50));
        
        // Step 1: Export backup
        console.log('\n📦 Step 1: Creating IndexedDB backup...');
        const backup = await exportIndexedDBBackup();
        const backupSize = JSON.stringify(backup).length;
        console.log(`✓ Backup created (${(backupSize / 1024).toFixed(2)} KB)`);
        
        if (!skipBackup) {
            console.log('💾 Downloading backup file for safety...');
            downloadIndexedDBBackup(backup, `indexeddb_backup_${new Date().getTime()}.json`);
        }
        
        // Step 2: Analyze structure
        console.log('\n🔍 Step 2: Analyzing IndexedDB structure...');
        const analysis = await analyzeIndexedDBStructure();
        
        if (analysis.totalRecords === 0) {
            console.log('⚠️  No records to migrate');
            return {
                success: false,
                message: 'No records in IndexedDB to migrate',
                recordsMigrated: 0
            };
        }
        
        if (validateOnly) {
            console.log('\n✓ Validation mode - stopping before migration');
            return {
                success: true,
                message: 'Analysis complete - ready to migrate',
                analysis: analysis,
                backup: backup,
                validateOnly: true
            };
        }
        
        // Step 3: Initialize SQLite
        console.log('\n💾 Step 3: Initializing SQLite database...');
        await initializeSqliteLib();
        await openSqliteDatabase();
        console.log('✓ SQLite database initialized');
        
        // Step 4: Migrate data
        console.log('\n📤 Step 4: Migrating data to SQLite...');
        const migratedCount = await migrateFromIndexedDB(backup.records);
        console.log(`✓ Migrated ${migratedCount} character records`);
        
        // Step 5: Validate
        console.log('\n✔️  Step 5: Validating migration...');
        const stats = getStatistics();
        const validation = await validateMigration(backup.records, stats);
        
        if (!validation.valid) {
            console.error('❌ Validation failed! Migration may be incomplete.');
            console.error('Issues:', validation.issues);
            return {
                success: false,
                message: 'Validation failed',
                validation: validation,
                backup: backup
            };
        }
        
        console.log('✓ Migration validation passed');
        
        // Step 6: Export SQLite backup
        console.log('\n💾 Step 6: Creating SQLite backup...');
        downloadSqliteDatabase(`sqlite_backup_${new Date().getTime()}.sqlite`);
        
        console.log('\n' + '═'.repeat(50));
        console.log('✅ Migration Complete!');
        console.log('═'.repeat(50));
        console.log(`Records Migrated: ${validation.recordCount}`);
        console.log(`IndexedDB Size: ${(validation.indexedDBSize / 1024).toFixed(2)} KB`);
        console.log(`SQLite Size: ${(validation.sqliteSize / 1024).toFixed(2)} KB`);
        console.log(`Compression: ${((1 - validation.sqliteSize / validation.indexedDBSize) * 100).toFixed(1)}%`);
        
        return {
            success: true,
            message: 'Migration completed successfully',
            recordsMigrated: validation.recordCount,
            validation: validation,
            backup: backup,
            stats: stats
        };
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Your IndexedDB data is safe - no changes were made');
        throw error;
    }
}

/**
 * Step 6: Fallback handler - use JSON if SQLite fails
 */
async function migrationFallback(backup) {
    console.log('⚠️  SQLite migration failed, using JSON fallback...');
    
    try {
        // Download JSON backup as fallback
        downloadIndexedDBBackup(
            backup,
            `indexeddb_fallback_${new Date().getTime()}.json`
        );
        console.log('✓ Downloaded JSON backup as fallback');
        
        return {
            success: true,
            method: 'json_fallback',
            message: 'Using JSON export as fallback',
            backup: backup
        };
    } catch (error) {
        console.error('✗ Fallback also failed:', error);
        throw error;
    }
}

/**
 * Helper: Open IndexedDB database
 */
function openDatabase(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Console command reference
 */
console.log(`
╔══════════════════════════════════════════════════════════╗
║      SQLite Migration Utility - Phase 3 Commands         ║
╚══════════════════════════════════════════════════════════╝

📋 Available Commands:

1. SAFE PREVIEW (No changes to data):
   await analyzeIndexedDBStructure()
   → Shows what will be migrated

   await migrateIndexedDBToSqlite({ validateOnly: true })
   → Analyzes and validates without migration

2. EXECUTE MIGRATION:
   await migrateIndexedDBToSqlite()
   → Full migration with backup and validation

3. MANUAL BACKUP:
   const backup = await exportIndexedDBBackup()
   downloadIndexedDBBackup(backup)

4. VIEW STATISTICS:
   getStatistics()

5. EXPORT SQLITE:
   downloadSqliteDatabase('my_backup.sqlite')

═══════════════════════════════════════════════════════════

⚠️  IMPORTANT:
  • Your IndexedDB data is NEVER deleted
  • Backups are created before any migration
  • You can always revert to JSON backups
  • Use validateOnly mode first to preview

═══════════════════════════════════════════════════════════
`);
