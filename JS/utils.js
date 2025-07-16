// utility functions

function waitForElement(selector, callback) {
    console.log("Waiting for:", selector);
    let element_observer = new MutationObserver((mutations, element_observer) => {
        let element = document.querySelector(selector);
        if (element) {
            console.log(element);
            element_observer.disconnect();
            return callback(element);
        }
    });

    element_observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Function to convert URL to Base64 with improved error handling
async function urlToBase64(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided');
    }
    
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            timeout: 10000, // Add timeout for better UX
            onload: function (response) {
                if (response.status === 200) {
                    const blob = response.response;
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = () => reject(new Error('Failed to read image data'));
                    reader.readAsDataURL(blob);
                } else {
                    reject(new Error(`HTTP error! Status: ${response.status}`));
                }
            },
            onerror: function (error) {
                console.error('Error fetching image:', error);
                reject(new Error('Network error while fetching image'));
            },
            ontimeout: function() {
                reject(new Error('Request timeout while fetching image'));
            }
        });
    });
}


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function fetchResource(resource) {

    return new Promise((resolve, reject) => {
        // Get the URL of the HTML file
        let htmlUrl = GM_getResourceURL(resource);

        // Fetch the HTML content using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: htmlUrl,
            onload: function (response) {
                if (response.status === 200) {
                    console.log(`Successfully fetched resource: ${resource}`);
                    resolve(response.responseText);
                } else {
                    console.error(`Error fetching resource: ${resource} - Status: ${response.status}`);
                    reject(new Error(`Failed to fetch resource. Status: ${response.status}`));
                }
            },
            onerror: function (error) {
                console.error('Error getting HTML:', error);
                reject(new Error('Network error while fetching resource.'));
            }
        });
    });
}

async function renderHTMLFromFile(resource) {
    try {
        let html = await fetchResource(resource);
        let element = document.createElement('div');
        element.innerHTML = html;
        console.log('Element Generated.', element);
        return element;
    } catch (error) {
        console.error('Failed to render HTML from file:', error);
        throw error;
    }
}


async function addMenuItem(targetElement, itemId, resourceName) {
    let element = document.getElementById(itemId);
    
    if (element) {
        console.log(itemId,'already found.');
        return Promise.resolve(null);
    }

    return renderHTMLFromFile(resourceName).then(item => {
        targetElement.appendChild(item);
        console.log(item, `menu item added.`);
        return item;
    });
}


function addCustomizeChatForm(itemId, resourceName) {
    console.log("Adding chat customizer form.");
    if (document.getElementById(itemId)) {
        let portalRoot = document.querySelector('#headlessui-portal-root');
        let main = document.querySelector('body > main');
        
        // yodayo does this by default so I'm just mimicing it
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = '1px';

        // To allow interaction with elements below the form
        if (main) {
            main.setAttribute('aria-hidden', 'true');
            main.setAttribute('inert', '');
        }
        
        if (portalRoot) {
            portalRoot.style.display = 'block';    
        } else {
            // Portal root doesn't exist, create new form
            renderHTMLFromFile(resourceName).then(chatCustomizerForm => {
                document.body.appendChild(chatCustomizerForm);
            });
        }

        return;
    }

    renderHTMLFromFile(resourceName).then(chatCustomizerForm => {
        document.body.appendChild(chatCustomizerForm)
    });


}


function addImageViewer(itemId, resourceName) {

    if (document.getElementById(itemId)) {
        let portalRoot = document.querySelector('#headlessui-portal-root');
        let main = document.querySelector('body > main');

        // yodayo does this by default so I'm just mimicing it
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = '1px';

        // To allow interaction with elements below the form
        if (main) {
            main.setAttribute('inert', '');
        }

        if (portalRoot) {
            portalRoot.style.display = 'block';
        } else {
            // Portal root doesn't exist, create new image viewer
            renderHTMLFromFile(resourceName).then(imageViewerBody => {
                document.body.appendChild(imageViewerBody);
                console.log('Image Viewer inserted:', imageViewerBody);
            });
        }

        return;
    }

    renderHTMLFromFile(resourceName).then(imageViewerBody => {
        document.body.appendChild(imageViewerBody);
        console.log('Image Viewer inserted:', imageViewerBody);
    });
}

function showInjectionNotification(resourceName, CHAR_ID, message="") {
    renderHTMLFromFile(resourceName).then(notification => {
        document.body.appendChild(notification);
        const noti = document.getElementById('notification');
        const paragraph = noti.querySelector('p');

        if (!CHAR_ID && !message) {
            noti.classList.remove('bg-green-500');
            noti.classList.add('bg-red-800');
            paragraph.textContent = 'Could not find Character ID, Please Refresh.';
        } else if (message) {
            paragraph.textContent = message;
        }

        setTimeout(() => {
            noti.classList.add('show');
        }, 1000); // Show the notification after 1 second

        setTimeout(() => {
            noti.classList.remove('show');
        }, 5000); // Hide the notification after 5 seconds
        console.log('Notification generated.', notification);
    });
}

// --- COLOR AND FORM UTILITIES ---
// Cache for color normalization to avoid repeated computations
const colorNormalizationCache = new Map();

/**
 * Normalizes color values to hex format for color inputs.
 * @param {string} color - The color value to normalize
 * @returns {string} - Normalized hex color value or original if already valid
 */
function normalizeColorForInput(color) {
    if (!color) return color;
    
    // Check cache first
    if (colorNormalizationCache.has(color)) {
        return colorNormalizationCache.get(color);
    }
    
    let result = color;
    
    // If already a valid hex color, return as is
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        result = color;
    } 
    // If hex without #, add it
    else if (/^[0-9A-Fa-f]{6}$/.test(color)) {
        result = '#' + color;
    }
    // Try to convert RGB/RGBA to hex
    else {
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
            const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
            const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
            result = `#${r}${g}${b}`;
        } else {
            // For named colors and other formats, try using a temporary element
            try {
                const tempElement = document.createElement('div');
                tempElement.style.color = color;
                document.body.appendChild(tempElement);
                const computedColor = window.getComputedStyle(tempElement).color;
                document.body.removeChild(tempElement);
                
                // Convert computed RGB to hex
                const computedRgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (computedRgbMatch) {
                    const r = parseInt(computedRgbMatch[1]).toString(16).padStart(2, '0');
                    const g = parseInt(computedRgbMatch[2]).toString(16).padStart(2, '0');
                    const b = parseInt(computedRgbMatch[3]).toString(16).padStart(2, '0');
                    result = `#${r}${g}${b}`;
                }
            } catch (e) {
                console.warn('Failed to normalize color:', color, e);
                result = color; // Return original if conversion fails
            }
        }
    }
    
    // Cache the result
    colorNormalizationCache.set(color, result);
    return result;
}

/**
 * Optimized form element setter with batching support
 * @param {HTMLElement} element - The form element to set
 * @param {string} value - The value to set
 * @param {boolean} suppressEvents - Whether to suppress events (for batch operations)
 */
function setFormElementValue(element, value, suppressEvents = false) {
    if (!element || value === null || value === undefined) return;
    
    const normalizedValue = element.type === 'color' ? normalizeColorForInput(value) : value;
    element.value = normalizedValue;
    
    if (!suppressEvents) {
        const eventType = element.type === 'color' ? 'change' : 'input';
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
    }
}

// --- DOM UTILITIES ---
/**
 * Adds the 'username' class to all username elements.
 * @returns {void}
 */
function addUserNameClass() {
    /** @type {NodeListOf<HTMLElement>} */
    let usernameElements = document.querySelectorAll(user_name);
    usernameElements.forEach((element) => {
        element.classList.add('username');
    });
}

/**
 * Handles DOM mutations to add the 'username' class to new username elements.
 * @param {MutationRecord[]} mutationsList
 * @returns {void}
 */
function handleMutations(mutationsList) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('p.text-xs.font-medium.opacity-50')) {
                        console.log(node);
                        node.classList.add('username');
                    }
                }
                node.querySelectorAll && node.querySelectorAll('p.text-xs.font-medium.opacity-50, p.space-x-1 > span').forEach((child) => {
                    if (child.matches('p.text-xs.font-medium.opacity-50')) {
                        console.log(node);
                        child.classList.add('username');
                    }
                });
            });
        }
    }
}

// --- PERFORMANCE UTILITIES ---
let cachedStyleSheets = null;
let dynamicStyleSheet = null;

/**
 * Gets filtered stylesheets, excluding Google Fonts for performance.
 * Uses caching to avoid repeated filtering.
 * @returns {CSSStyleSheet[]}
 */
function getCachedStyleSheets() {
    if (!cachedStyleSheets) {
        cachedStyleSheets = Array.from(document.styleSheets).filter(sheet =>
            !sheet.href || !sheet.href.includes('fonts.googleapis.com')
        );
    }
    return cachedStyleSheets;
}

/**
 * Gets or creates a dynamic stylesheet for custom CSS rules.
 * @returns {CSSStyleSheet}
 */
function getDynamicStyleSheet() {
    if (!dynamicStyleSheet) {
        let styleElement = document.getElementById('chat-customizer-dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'chat-customizer-dynamic-styles';
            document.head.appendChild(styleElement);
        }
        dynamicStyleSheet = styleElement.sheet;
    }
    return dynamicStyleSheet;
}

/**
 * Applies CSS rules using a dynamic stylesheet for better performance.
 * @param {string} selector
 * @param {Object} styles
 */
function applyDynamicStyle(selector, styles) {
    const sheet = getDynamicStyleSheet();
    const styleString = Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`).join('; ');
    const rule = `${selector} { ${styleString} !important; }`;

    try {
        sheet.insertRule(rule, sheet.cssRules.length);
    } catch (e) {
        console.warn('Failed to insert CSS rule:', rule, e);
    }
}

/**
 * Standardized image data handler for consistent base64/URL processing
 * This function normalizes different image data formats and returns the appropriate src value
 * @param {string} imageData - Image data (URL, data URL, or pure base64)
 * @returns {string} Properly formatted image src
 */
function normalizeImageData(imageData) {
    if (!imageData || typeof imageData !== 'string') {
        throw new Error('Invalid image data provided');
    }

    // Check if it's already a data URL
    if (imageData.startsWith('data:image')) {
        return imageData;
    }
    
    // Check if it's a regular URL
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        return imageData;
    }
    
    // Assume it's a pure base64 string (stored format in our database)
    // Add the data URL prefix
    return `data:image/png;base64,${imageData}`;
}

/**
 * Checks if the provided string is a URL (not base64 data)
 * @param {string} str - String to check
 * @returns {boolean} True if it's a URL, false otherwise
 */
function isImageUrl(str) {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * Checks if the provided string is already a data URL
 * @param {string} str - String to check  
 * @returns {boolean} True if it's a data URL, false otherwise
 */
function isDataUrl(str) {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('data:image');
}

/**
 * Checks if the provided string is pure base64 data (our storage format)
 * @param {string} str - String to check
 * @returns {boolean} True if it's likely pure base64, false otherwise
 */
function isPureBase64(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Not a URL and not a data URL, and is long enough to be base64
    return !isImageUrl(str) && !isDataUrl(str) && str.length > 50;
}

/**
 * Optimized cache clearing with selective resets
 */
function clearCaches() {
    cachedStyleSheets = null;
    dynamicStyleSheet = null;
    
    // Clear color normalization cache if it gets too large
    if (colorNormalizationCache.size > 100) {
        colorNormalizationCache.clear();
    }
}

