function fetchResource(resource) {
    console.log(`Requesting resource: ${resource}`);

    return new Promise((resolve, reject) => {
        // Get the URL of the HTML file
        const htmlUrl = GM_getResourceURL(resource);

        // Fetch the HTML content using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: htmlUrl,
            responseType: 'text',
            onload: function (response) {
                console.log(`Successfully fetched resource: ${resource}`);
                resolve(response.responseText);
            },
            onerror: function (error) {
                console.error('Error getting HTML:', error);
                reject(error);
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

function addMenuItem(menu, itemId, resourceName, clickHandler) {
    console.log(`Adding ${itemId} menu item.`);

    if (menu.querySelector(`#${itemId}`)) {
        console.log(`${itemId} menu item already exists. Skipping.`);
        return;
    }

    renderHTMLFromFile(resourceName).then(item => {
        const referenceElement = document.querySelector('[data-floating-ui-portal]');
        if (!referenceElement) {
            console.error('Reference element not found.');
            return;
        }

        menu.appendChild(item);
        console.log(`${itemId} menu item added:`, item);

        item.addEventListener('click', clickHandler);
    });
}
