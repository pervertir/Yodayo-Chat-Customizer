(async function () {
    'use strict';

    console.log('Chat Customizer script initialized.');
    let scriptLoaded = false;
    let urlCheckInterval = null;
    let observer = null;

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
    
    // Function to check if the current URL matches the target pattern
    function isTargetUrl() {
        return location.href.startsWith('https://yodayo.com/tavern/chat/');
    }

    // Function to hide elements by ID
    function hideElementsById(...ids) {
        ids.forEach(id => {
            let element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // Function to initialize the script
    function initializeScript() {
        if (isTargetUrl()) {
            if (!scriptLoaded) {
                scriptLoaded = true;
                // Place your script's main logic here
                console.log('Yodayo Chat Customizer script is running');
                waitForElement(char_id_selector, onLoad);

            }
        } else if (!isTargetUrl() && scriptLoaded) {
            console.log('Exited chat page, hiding menu items.');
            scriptLoaded = false; // Reset scriptLoaded flag
            if (observer) { observer.disconnect(); }
            hideElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);
        }
    }

    // Variable to keep track of the last URL
    let lastUrl = location.href;
    initializeScript();

    // Function to check for URL changes
    function checkUrlChange() {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            initializeScript();
            lastUrl = currentUrl;
        }
    }

    // Set up a popstate event listener to handle browser navigation events
    window.addEventListener('popstate', checkUrlChange);

    // Periodically check for URL changes
    urlCheckInterval = setInterval(checkUrlChange, 1000);

    function addCustomizeMenuItems(menu) {

        Promise.all([
            addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name),
            addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name)
        ]).then(([chatCustomizeButton, dbConnectButton]) => {
            if (chatCustomizeButton) {
                chatCustomizeButton.addEventListener('click', () =>
                    addCustomizeChatForm(chat_customizer_body_id, chat_customizer_body_resource_name));
                    // Create a new observer
                    let formAdded_observer = new MutationObserver(handleFormAdded);
                    // Start observing the body for changes
                    formAdded_observer.observe(document.body, { childList: true, subtree: true });

            }

            if (dbConnectButton) {
                dbConnectButton.addEventListener('click', () =>
                    addImageViewer(db_explorer_body_id, image_viewer_popup_resource_name));
            }
        });


    }

    function onLoad(element) {
        console.log('Page loaded');

        // const CHAR_ID = waitForElement(char_id_selector, findCharacterID);
        const CHAR_ID = findCharacterID(element);
        console.log('Char ID: ', CHAR_ID);
        showInjectionNotification(notification_resource_name, CHAR_ID);

        let observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.id && node.id.startsWith('headlessui-menu-items')) {
                            if (isTargetUrl()) {
                                addCustomizeMenuItems(node);

                            }
                        }
                    });
                }
            }
        });

        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
    }

    // Clean up event listeners and intervals when the script is unloaded
    window.addEventListener('unload', () => {
        window.removeEventListener('popstate', checkUrlChange);
        clearInterval(urlCheckInterval);
        if (observer) { observer.disconnect(); }
    });

})();
