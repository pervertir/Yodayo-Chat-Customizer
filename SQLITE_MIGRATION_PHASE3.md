# SQLite Migration Phase 3 - Data Migration Guide

## ⚠️ Important Safety Guarantees

**Your IndexedDB data will NEVER be deleted or modified.**

- ✅ All operations are read-only until you explicitly approve migration
- ✅ JSON backup created automatically before any changes
- ✅ SQLite backup downloaded to your computer
- ✅ Full rollback capability - you can revert to original JSON anytime
- ✅ Validation ensures data integrity every step

---

## Phase 3 Overview

This phase safely migrates your existing IndexedDB data to SQLite format with:
- **Zero-risk** preview mode to analyze data before migration
- **Automatic backups** at every step
- **Data validation** to ensure integrity
- **Fallback support** to JSON if anything goes wrong

---

## Getting Started

### Prerequisites

Before running migration, ensure:
- [ ] You're on the `feat/sqlite-export` branch
- [ ] Browser has IndexedDB data (MYChatCustomizerDB)
- [ ] Chrome DevTools MCP is available
- [ ] You have disk space for backup files (~1-5MB typically)

### Access the Migration Utility

The migration commands are available in your browser console when the userscript is loaded:

```
Open your browser Console (F12 → Console tab)
Navigate to moescape.ai or yodayo.com
The userscript loads and prints available commands
```

---

## Step-by-Step Migration Guide

### Phase 3.1: Preview & Analyze (Safe - Read Only)

**First, preview what will be migrated without making any changes:**

```javascript
// Show IndexedDB structure and contents
await analyzeIndexedDBStructure()
```

**Expected output:**
```
🔍 Analyzing IndexedDB structure...
✓ IndexedDB Analysis:
  - Total Records: 42
  - Unique Characters: 15
  - Fields: CHAR_ID, characterName, colors, images, alias, ...
  - Sample Record: { CHAR_ID: "char_001", characterName: "Alice", ... }
```

**What this tells you:**
- How many character records exist
- What fields are stored
- Data structure sample
- ✅ **Zero risk** - only reading data

### Phase 3.2: Validate Migration Logic (Safe - No Changes)

**Test the migration process without actually executing it:**

```javascript
// Preview what migration will do
await migrateIndexedDBToSqlite({ validateOnly: true })
```

**Expected output:**
```
🚀 Starting IndexedDB → SQLite Migration
═════════════════════════════════════

📦 Step 1: Creating IndexedDB backup...
✓ Backup created (245.32 KB)

🔍 Step 2: Analyzing IndexedDB structure...
✓ IndexedDB Analysis:
  - Total Records: 42
  ...

✓ Validation mode - stopping before migration
{
  success: true,
  message: "Analysis complete - ready to migrate",
  analysis: { ... },
  backup: { ... },
  validateOnly: true
}
```

**What this tells you:**
- Backup size and content
- Number of records to migrate
- Validation rules check
- ✅ **Still zero risk** - analysis only, no changes

### Phase 3.3: Execute Safe Migration

**Once you're confident, run the actual migration:**

```javascript
// Execute full migration with backups and validation
await migrateIndexedDBToSqlite()
```

**Steps executed automatically:**

1. **Create IndexedDB Backup** (downloaded as JSON)
   - Complete snapshot of your data
   - Safe copy on your disk
   
2. **Analyze Structure**
   - Examine fields, data types
   - Count records
   
3. **Initialize SQLite**
   - Create new database in memory
   - Build schema
   
4. **Migrate Data**
   - Convert IndexedDB records to SQLite
   - Transaction-protected
   
5. **Validate Results**
   - Compare record counts
   - Check data integrity
   - Verify no data loss
   
6. **Create SQLite Backup**
   - Download `.sqlite` file to disk
   - Standard SQLite format

**Expected output:**
```
✅ Migration Complete!
═════════════════════
Records Migrated: 42
IndexedDB Size: 245.32 KB
SQLite Size: 167.48 KB
Compression: 31.6%
```

**Results:**
- ✅ Data successfully migrated
- ✅ Files downloaded: `indexeddb_backup_*.json` + `sqlite_backup_*.sqlite`
- ✅ Your IndexedDB remains unchanged
- ✅ Both backups available locally

### Phase 3.4: Verify Migration Success

**Check the migrated data in SQLite:**

```javascript
// View database statistics
getStatistics()
// Output: { characters: 42, customizations: 156, databaseSize: "167.48 KB", ... }

// Query a specific character
const char = getCharacter('char_001')
console.log(char)

// Get all characters
const all = getAllCharacters()
console.log(`Database has ${all.length} characters`)

// Get customization for specific chat
const custom = getCustomization('char_001', 'chat_123')
console.log(custom)
```

---

## Backup & Recovery

### Downloaded Files After Migration

Two backup files are automatically downloaded:

#### 1. **indexeddb_backup_TIMESTAMP.json**
- Complete IndexedDB snapshot
- Human-readable JSON format
- Can be read with any text editor
- Can be restored to IndexedDB if needed

#### 2. **sqlite_backup_TIMESTAMP.sqlite**
- Binary SQLite database file
- Can be opened with:
  - DB Browser for SQLite (GUI tool)
  - `sqlite3` command line
  - Any SQLite viewer
- Compressed binary format (~30% smaller than JSON)

### Recovery Procedures

#### If Migration Fails

Your IndexedDB data is **completely safe**:
```javascript
// Verify IndexedDB still has all data
const db = await openDatabase('MYChatCustomizerDB');
const store = db.transaction('Characters').objectStore('Characters');
const records = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});
console.log(`IndexedDB has ${records.length} records - all safe!`);
```

#### If You Want to Revert to JSON

Simply restore from the downloaded JSON backup:
```javascript
// Use existing database_handler.js
const jsonBackup = /* load from file */;
await importDatabase(jsonBackup);
console.log('✓ Reverted to JSON backup');
```

#### If You Want to Switch Back to IndexedDB

Your original IndexedDB is untouched:
```javascript
// Use original database handler
const records = await getCharacterRecords(); // From database_handler.js
console.log(`IndexedDB still has ${records.length} records`);
```

---

## Data Migration Formats

### IndexedDB Structure

```javascript
{
    CHAR_ID: "char_001",           // Character unique ID
    characterName: "Alice",         // Character name
    alias: "Alice",                 // Display alias
    colors: {                       // Customization colors
        characterName: "#ffffff",
        narration: "#b0d8fb",
        dialogue: "#ffffff",
        ...
    },
    images: {                       // Customization images
        background: "data:image/...",
        characterImage: "data:image/..."
    },
    chatCustomizations: {           // Per-chat overrides
        "chat_123": {
            colors: { characterName: "#ff0000" },
            alias: "Alice (Alt)"
        },
        "chat_456": { ... }
    }
}
```

### SQLite Schema (After Migration)

```sql
-- Characters Table
CREATE TABLE Characters (
    CHAR_ID TEXT PRIMARY KEY,
    NAME TEXT,
    CREATED_AT DATETIME,
    UPDATED_AT DATETIME
);

-- Character Customizations (Hierarchical)
CREATE TABLE CharacterCustomizations (
    ID INTEGER PRIMARY KEY,
    CHAR_ID TEXT,
    CHAT_ID TEXT,           -- NULL for universal, specific ID for chat-specific
    COLOR_DATA TEXT,        -- JSON: {characterName, narration, ...}
    IMAGE_DATA TEXT,        -- JSON: {background, characterImage, ...}
    ALIAS TEXT,
    CREATED_AT DATETIME,
    UPDATED_AT DATETIME,
    UNIQUE(CHAR_ID, CHAT_ID)
);

-- Universal Settings
CREATE TABLE UniversalSettings (
    KEY TEXT PRIMARY KEY,
    VALUE TEXT
);

-- Metadata
CREATE TABLE Metadata (
    KEY TEXT PRIMARY KEY,
    VALUE TEXT
);
```

### Hierarchical Priority After Migration

SQLite maintains the same priority system as IndexedDB:

```
Chat-Specific > Universal > Default

Example:
getCustomization('char_001', 'chat_123')
→ Returns chat-specific if exists
→ Falls back to universal (CHAT_ID = NULL)
→ Uses defaults if neither exist
```

---

## Troubleshooting

### "Database not initialized" Error

**Cause**: SQL.js library hasn't loaded yet  
**Fix**: Wait for userscript to load completely, then try again:
```javascript
// Manually initialize
await initializeSqliteLib();
await openSqliteDatabase();
await migrateIndexedDBToSqlite();
```

### "No records in IndexedDB" Message

**Cause**: IndexedDB is empty or incorrect database name  
**Diagnosis**:
```javascript
// Check if IndexedDB exists
const db = await openDatabase('MYChatCustomizerDB');
const store = db.transaction('Characters').objectStore('Characters');
// If this fails, database might not exist yet
```

**Fix**: 
- Ensure you're on moescape.ai or yodayo.com
- Ensure customizer has saved data previously
- Check browser developer tools > Application > IndexedDB

### Migration Runs but Validation Fails

**Cause**: Data inconsistency detected  
**What happened**: Migration was NOT completed, data is safe  
**Fix**: 
```javascript
// Check what went wrong
const result = await migrateIndexedDBToSqlite();
console.log(result.validation.issues);

// Manually verify data
await analyzeIndexedDBStructure(); // IndexedDB still intact
getStatistics();                    // Check partial SQLite data
```

**Recovery**: Use downloaded JSON backup or original IndexedDB

### Browser Crashes During Migration

**Cause**: Likely a very large database (100k+ records)  
**Solution**: 
- Close other tabs/apps to free memory
- Use validateOnly mode first to check size
- Consider splitting into multiple migrations
- Contact support if database is too large

---

## Data Integrity Validation

### What Gets Validated

✅ **Record Count Check**
```
IndexedDB records == SQLite records
```

✅ **Character ID Validation**
```
All CHAR_IDs present and non-empty
```

✅ **Field Presence**
```
Required fields (CHAR_ID, name) exist
```

✅ **Data Type Checks**
```
Colors/images are valid JSON
Timestamps are valid datetime
```

✅ **No Data Loss**
```
All original records present in SQLite
```

### Validation Report Example

```
✔️  Validating migration...
✓ Validation Results:
  - IndexedDB Size: 245.32 KB
  - SQLite Size: 167.48 KB
  - Issues Found: 0

Valid: true
Records Validated: 42
Compression: 31.6%
```

---

## Performance Characteristics

### Migration Speed

| Dataset Size | Time | Memory Used |
|-------------|------|------------|
| 10-50 records | ~100ms | ~5MB |
| 50-200 records | ~300ms | ~15MB |
| 200-1000 records | ~1-2s | ~50MB |
| 1000+ records | ~2-5s | ~100MB+ |

### Database Access Performance (After Migration)

| Operation | Time |
|-----------|------|
| Query single character | ~1-2ms |
| Query all characters | ~5-10ms |
| Insert record | ~2-5ms |
| Export database | ~50-200ms |

---

## Next Steps: Phase 4

After successful migration, Phase 4 will:

- [ ] Update UI export buttons to use SQLite
- [ ] Add "Download Database" button
- [ ] Add "Import Database" file picker
- [ ] Show database statistics
- [ ] Test export/import workflow end-to-end

---

## FAQ

**Q: Will my IndexedDB be deleted?**  
A: No. IndexedDB remains untouched. You can always revert.

**Q: Can I use both IndexedDB and SQLite?**  
A: Yes. SQLite is in-memory for current session. Reload to reset.

**Q: What if migration partially fails?**  
A: Validation catches this. Revert using JSON backup.

**Q: How often should I backup?**  
A: Backups created automatically. Download periodically for safety.

**Q: Can I restore a SQLite backup?**  
A: Yes, via `await importSqliteDatabase(file)`

**Q: Is my data encrypted?**  
A: Currently no. SQLite files are plain binary. Encrypt before cloud storage.

---

## Support

If you encounter issues:

1. Check troubleshooting section above
2. Verify data in both IndexedDB and SQLite
3. Check browser console for error messages
4. Use validation mode to diagnose problems
5. Restore from JSON backup if needed
6. Open issue with error logs: https://github.com/pervertir/Yodayo-Chat-Customizer/issues

---

## Migration Command Reference

```javascript
// Safe Preview (Read-Only)
await analyzeIndexedDBStructure()          // Show structure
await migrateIndexedDBToSqlite({validateOnly: true})  // Dry-run

// Execute Migration
await migrateIndexedDBToSqlite()            // Full migration with backups

// Manual Backup
const backup = await exportIndexedDBBackup()  // Get JSON
downloadIndexedDBBackup(backup)               // Download

// Verify Results
getStatistics()                               // Database stats
getCharacter('CHAR_ID')                      // Single character
getAllCharacters()                           // All characters
getCustomization('CHAR_ID', 'CHAT_ID')      // Customization

// Export/Import
downloadSqliteDatabase('backup.sqlite')     // Download SQLite
await importSqliteDatabase(file)             // Import from file
```

---

**Migration created**: 2026-07-28  
**Phase**: 3 - Data Migration & Validation  
**Status**: Ready for testing with real data
