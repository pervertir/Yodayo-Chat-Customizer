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

