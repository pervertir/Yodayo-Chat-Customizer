/**
 * PNG Chunk Handler for embedding and extracting IndexedDB data
 * Uses png-chunk-text library to embed database exports into PNG images
 */

// Constants for PNG chunk handling
const DB_CHUNK_KEYWORD = 'MYChatCustomizer';
const DB_CHUNK_DESCRIPTION = 'Yodayo Chat Customizer Database Export';

/**
 * Creates properly formatted text chunk data for PNG tEXt chunks
 * @param {string} keyword - The keyword (max 79 characters)
 * @param {string} text - The text data to embed
 * @returns {Uint8Array} Formatted text chunk data
 */
function createTextChunk(keyword, text) {
    // Ensure keyword doesn't exceed PNG limit
    if (keyword.length > 79) {
        throw new Error(`Keyword "${keyword}" is longer than the 79-character limit imposed by the PNG specification`);
    }
    
    // Convert strings to UTF-8 bytes
    const keywordBytes = new TextEncoder().encode(keyword);
    const textBytes = new TextEncoder().encode(text);
    
    // Create the chunk data: keyword + null separator + text
    const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
    
    // Copy keyword
    chunkData.set(keywordBytes, 0);
    
    // Add null separator
    chunkData[keywordBytes.length] = 0;
    
    // Copy text data
    chunkData.set(textBytes, keywordBytes.length + 1);
    
    return chunkData;
}

/**
 * Embeds database export data into a PNG image
 * @param {File|Blob} pngFile - The PNG image file
 * @param {string} dbData - JSON string of the database export
 * @returns {Promise<Blob>} Modified PNG with embedded data
 */
async function embedDataIntoPNG(pngFile, dbData) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Extract existing chunks
                const chunks = extract(uint8Array);
                
                // Create new text chunk with our data
                const textChunk = {
                    name: 'tEXt',
                    data: createTextChunk(DB_CHUNK_KEYWORD, dbData)
                };
                
                // Add our chunk before the IEND chunk
                const iendIndex = chunks.findIndex(chunk => chunk.name === 'IEND');
                if (iendIndex !== -1) {
                    chunks.splice(iendIndex, 0, textChunk);
                } else {
                    chunks.push(textChunk);
                }
                
                // Encode back to PNG
                const modifiedPNG = encode(chunks);
                const blob = new Blob([modifiedPNG], { type: 'image/png' });
                
                resolve(blob);
            } catch (error) {
                reject(new Error('Failed to embed data into PNG: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read PNG file'));
        reader.readAsArrayBuffer(pngFile);
    });
}

/**
 * Extracts database data from a PNG image
 * @param {File|Blob} pngFile - The PNG image file with embedded data
 * @returns {Promise<string|null>} Extracted JSON string or null if not found
 */
async function extractDataFromPNG(pngFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Extract chunks
                const chunks = extract(uint8Array);
                
                // Find our text chunk
                const textChunks = chunks.filter(chunk => chunk.name === 'tEXt');
                
                for (const chunk of textChunks) {
                    const parsedData = parseTextChunk(chunk.data);
                    if (parsedData && parsedData.keyword === DB_CHUNK_KEYWORD) {
                        resolve(parsedData.text);
                        return;
                    }
                }
                
                // No matching chunk found
                resolve(null);
            } catch (error) {
                reject(new Error('Failed to extract data from PNG: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read PNG file'));
        reader.readAsArrayBuffer(pngFile);
    });
}

/**
 * Parses text chunk data to extract keyword and text
 * @param {Uint8Array} chunkData - Raw text chunk data
 * @returns {Object|null} Object with keyword and text properties, or null if invalid
 */
function parseTextChunk(chunkData) {
    try {
        // Find the null separator
        let separatorIndex = -1;
        for (let i = 0; i < chunkData.length; i++) {
            if (chunkData[i] === 0) {
                separatorIndex = i;
                break;
            }
        }
        
        if (separatorIndex === -1) {
            return null; // No separator found
        }
        
        // Extract keyword and text
        const keywordBytes = chunkData.slice(0, separatorIndex);
        const textBytes = chunkData.slice(separatorIndex + 1);
        
        const keyword = new TextDecoder().decode(keywordBytes);
        const text = new TextDecoder().decode(textBytes);
        
        return { keyword, text };
    } catch (error) {
        console.warn('Failed to parse text chunk:', error);
        return null;
    }
}

/**
 * Creates a PNG file with embedded database data using the default YCC logo
 * @param {string} dbData - JSON string of the database export
 * @returns {Promise<Blob>} PNG file with embedded data
 */
async function createPNGWithData(dbData) {
    // Always use default YCC image
    const defaultImage = await getDefaultBaseImage();
    return embedDataIntoPNG(defaultImage, dbData);
}

/**
 * Gets the default YCC base image from resources
 * @returns {Promise<Blob>} Default YCC image blob
 */
async function getDefaultBaseImage() {
    try {
        // Get the resource URL and fetch the image
        const imageUrl = GM_getResourceURL(ycc_default_image_resource_name);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch default image');
        }
        
        return await response.blob();
    } catch (error) {
        console.warn('Failed to load default YCC image, falling back to minimal PNG:', error);
        // Fallback to minimal PNG if default image fails
        return createMinimalPNG();
    }
}

/**
 * Creates a minimal 1x1 transparent PNG
 * @returns {Blob} Minimal PNG blob
 */
function createMinimalPNG() {
    // Minimal 1x1 transparent PNG data
    const pngData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR chunk type
        0x00, 0x00, 0x00, 0x01, // Width: 1
        0x00, 0x00, 0x00, 0x01, // Height: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: RGBA, Compression: 0, Filter: 0, Interlace: 0
        0x1F, 0x15, 0xC4, 0x89, // IHDR CRC
        0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT chunk type
        0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, // Compressed image data (transparent pixel)
        0x21, 0xBC, 0x33, 0x81, // IDAT CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND chunk type
        0xAE, 0x42, 0x60, 0x82  // IEND CRC
    ]);
    
    return new Blob([pngData], { type: 'image/png' });
}

/**
 * Validates if a file is a valid PNG
 * @param {File|Blob} file - File to validate
 * @returns {Promise<boolean>} True if valid PNG
 */
async function isValidPNG(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Check PNG signature
            const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            
            if (uint8Array.length < 8) {
                resolve(false);
                return;
            }
            
            for (let i = 0; i < 8; i++) {
                if (uint8Array[i] !== pngSignature[i]) {
                    resolve(false);
                    return;
                }
            }
            
            resolve(true);
        };
        
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 8));
    });
}

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * High-level function to export database to PNG with YCC logo
 * @param {string} [filename] - Optional filename, defaults to timestamp-based name
 * @returns {Promise<void>}
 */
async function exportDatabaseToPNG(filename = null) {
    try {
        // Get database export
        const dbData = await exportDatabase();
        
        // Create PNG with embedded data using default YCC image
        const pngWithData = await createPNGWithData(dbData);
        
        // Generate filename if not provided
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            filename = `yodayo-chat-customizer-export-${timestamp}.png`;
        }
        
        // Download the file
        downloadBlob(pngWithData, filename);
        
        console.log('Database exported to PNG successfully');
    } catch (error) {
        console.error('Failed to export database to PNG:', error);
        throw error;
    }
}

/**
 * High-level function to import database from PNG
 * @param {File} pngFile - PNG file containing embedded data
 * @param {boolean} [clearExisting=false] - Whether to clear existing data
 * @returns {Promise<{imported: number, errors: string[]}>}
 */
async function importDatabaseFromPNG(pngFile, clearExisting = false) {
    try {
        // Validate PNG file
        if (!(await isValidPNG(pngFile))) {
            throw new Error('Invalid PNG file');
        }
        
        // Extract data from PNG
        const dbData = await extractDataFromPNG(pngFile);
        
        if (!dbData) {
            throw new Error('No database data found in PNG file');
        }
        
        // Import the data
        const result = await importDatabase(dbData, clearExisting);
        
        console.log(`Database imported from PNG: ${result.imported} records imported`);
        if (result.errors.length > 0) {
            console.warn('Import errors:', result.errors);
        }
        
        return result;
    } catch (error) {
        console.error('Failed to import database from PNG:', error);
        throw error;
    }
}
