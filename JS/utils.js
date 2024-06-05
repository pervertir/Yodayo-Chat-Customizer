// utility functions
function fetchResource(resource) {
    console.log(`Requesting resource: ${resource}`);

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


function addMenuItem(targetElement, itemId, resourceName) {
    console.log(`Adding ${itemId} item.`);

    if (targetElement.querySelector(`#${itemId}`)) {
        console.log(`${itemId} menu item already exists. Skipping.`);
        return Promise.resolve(null);
    }

    return renderHTMLFromFile(resourceName).then(item => {
        item.id = itemId; // Ensure the item has the correct ID
        targetElement.appendChild(item);
        console.log(item, `menu item added with id ${itemId}.`);
        return item;
    });
}


function addCustomizeChatForm(targetElement, itemId, resourceName) {
    console.log('Customize menu item clicked.');
    
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.paddingRight = '1px';
    
    const main = document.querySelector('body > main');
    main.setAttribute('aria-hidden', 'true');
    main.setAttribute('inert', '');    

    if (document.querySelector(`#${itemId}`)) {
        console.log(`${itemId} menu item already exists. Skipping.`);
        return;
    }

    renderHTMLFromFile(resourceName).then(chatCustomizerForm => {
        let referenceElement = document.querySelector(targetElement);
        document.body.appendChild(chatCustomizerForm)
        // if (!referenceElement) {
        //     console.error('Reference element not found. Trying multi-select-root', targetElement);
        //     referenceElement = document.querySelector('#multi-select-root');
        //     if (!referenceElement) return;
        // }

        // referenceElement.insertAdjacentElement('afterend', chatCustomizerForm);
        // console.log('Chat customizer form inserted:', chatCustomizerForm);
    });


}


function addImageViewer(targetElement, itemId, resourceName) {
    console.log('Customize menu item clicked.');

    if (document.querySelector(`#${itemId}`)) {
        console.log(`${itemId} menu item already exists. Skipping.`);
        return;
    }

    renderHTMLFromFile(resourceName).then(imageViewerBody => {
        let referenceElement = document.querySelector(targetElement);
        if (!referenceElement) {
            console.error('Reference element not found. Trying multi-select-root', targetElement);
            referenceElement = document.querySelector('#multi-select-root');
            if (!referenceElement) return;
        }

        referenceElement.insertAdjacentElement('afterend', imageViewerBody);
        console.log('Chat customizer form inserted:', imageViewerBody);
    });
}

