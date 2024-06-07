// utility functions
function fetchResource(resource) {

    return new Promise((resolve, reject) => {
        // Get the URL of the HTML file
        const htmlUrl = GM_getResourceURL(resource);

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
        const html = await fetchResource(resource);
        const element = document.createElement('div');
        element.innerHTML = html;
        console.log('Element Generated.', element);
        return element;
    } catch (error) {
        console.error('Failed to render HTML from file:', error);
        throw error;
    }
}

async function showNotification(text){
    
}

async function addMenuItem(targetElement, itemId, resourceName) {
    const menu_parent = document.getElementById('headlessui-menu-button-:r5q:');
    const element = document.getElementById(itemId);
    console.log('Trying to find: ', itemId);
    if (element) {
        console.log(itemId,'already found.');
        return Promise.resolve(null);
    }

    return renderHTMLFromFile(resourceName).then(item => {
        // item.id = itemId; // Ensure the item has the correct ID
        targetElement.appendChild(item);
        console.log(item, `menu item added.`);
        return item;
    });
}


function addCustomizeChatForm(itemId, resourceName) {
    
    if (document.getElementById(itemId)) {
        let form = document.querySelector('#headlessui-portal-root');
        let main = document.querySelector('body > main');
        
        // yodayo does this by default so I'm just mimicing it
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = '1px';

        // To allow interaction with elements below the form
        main.setAttribute('aria-hidden', 'true');
        main.setAttribute('inert', '');
        
        form.style.display = 'block';    

        return;
    }

    renderHTMLFromFile(resourceName).then(chatCustomizerForm => {
        document.body.appendChild(chatCustomizerForm)
    });


}


function addImageViewer(itemId, resourceName) {

    if (document.getElementById(itemId)) {
        let form = document.querySelector('#image-viewer-ui-popup');
        let main = document.querySelector('body > main');

        // yodayo does this by default so I'm just mimicing it
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = '1px';

        // To allow interaction with elements below the form
        main.setAttribute('inert', '');

        form.style.display = 'block';

        return;
    }

    renderHTMLFromFile(resourceName).then(imageViewerBody => {
        document.body.appendChild(imageViewerBody)
        console.log('Image Viewer inserted:', imageViewerBody);
    });
}

function showInjectionNotification(resourceName){
    renderHTMLFromFile(resourceName).then(imageViewerBody => {
        document.body.appendChild(imageViewerBody)
        console.log('Notification generated.', imageViewerBody);
    });
}