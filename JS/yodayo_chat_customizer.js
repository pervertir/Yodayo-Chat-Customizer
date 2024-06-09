(async function () {
    'use strict';

    console.log('Chat Customizer script initialized.');
    let scriptLoaded = false;
    let observer = null; // Declare observer in the correct scope
    let urlCheckInterval = null;

    // Function to check if the current URL matches the target pattern
    function isTargetUrl() {
        return location.href.startsWith('https://yodayo.com/tavern/chat/');
    }

    // Function to hide elements by ID
    function hideElementsById(...ids) {
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // Function to initialize the script
    function initializeScript() {
        if (isTargetUrl()) {
            if (!scriptLoaded) {
                setTimeout(() => {
                    scriptLoaded = true;
                    // Place your script's main logic here
                    console.log('Yodayo Chat Customizer script is running');
                    onLoad();
                }, 2000);  // 2000 milliseconds equals 2 seconds
            }
        } else if (!isTargetUrl() && scriptLoaded) {
            console.log('Exited chat page, hiding menu items.');
            if (observer) {observer.disconnect();}
            hideElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);
            scriptLoaded = false; // Reset scriptLoaded flag
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
        let fromAdded = false;
        let imageViewerAdded = false;
        Promise.all([
            addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name),
            addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name)
        ]).then(([chatCustomizeButton, dbConnectButton]) => {
            if (chatCustomizeButton) {
                fromAdded = true;
                chatCustomizeButton.addEventListener('click', () =>
                    addCustomizeChatForm(chat_customizer_body_id, chat_customizer_body_resource_name));
            }

            if (dbConnectButton) {
                imageViewerAdded = true;
                dbConnectButton.addEventListener('click', () =>
                    addImageViewer(db_explorer_body_id, image_viewer_popup_resource_name));
                }

                
        });
        
        let message = `Chat Customizer Added: ${fromAdded}\nImage Viewer Added: ${imageViewerAdded}}`;
        showInjectionNotification(notification_resource_name, message);
    }

    function onLoad() {
        console.log('Page loaded');

        setTimeout(() => {
            const CHAR_ID = findCharacterID();
            console.log('Char ID: ', CHAR_ID);
        }, 2000);  // 2000 milliseconds equals 2 seconds
        observer = new MutationObserver((mutations) => {
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
        if (observer) {observer.disconnect();}
    });

})();
