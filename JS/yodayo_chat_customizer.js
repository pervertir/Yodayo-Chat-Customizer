(async function () {
    'use strict';

    console.log('Chat Customizer script initialized.');
    let scriptLoaded = false;
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
            setTimeout(() => {
                scriptLoaded = true;
                // Place your script's main logic here
                console.log('Yodayo Chat Customizer script is running');
            
                onLoad();
            }, 2000);  // 2000 milliseconds equals 2 seconds

        }
        else if(!isTargetUrl() && scriptLoaded === true){
            console.log('Exited chat page, hiding menu items.');
            observer.disconnect();
            // hideElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);
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
    setInterval(checkUrlChange, 1000);

    
    function addCustomizeMenuItems(menu) {
        Promise.all([
            addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name),
            addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name)
        ]).then(([chatCustomizeButton, dbConnectButton]) => {
            const target_element = '#headlessui-portal-root';
            if (chatCustomizeButton) {
                chatCustomizeButton.addEventListener('click', () => 
                    addCustomizeChatForm(chat_customizer_body_id, chat_customizer_body_resource_name));
                    // setupChatCustomizerEventListeners();
            }

            if (dbConnectButton) {
                dbConnectButton.addEventListener('click', () => 
                    addImageViewer(db_explorer_body_id, image_viewer_popup_resource_name));
            }
        });
    }
    
    function onLoad() {
        console.log('Page loaded');
        
        setTimeout(() => {
            const CHAR_ID = findCharacterID();
            console.log('Char ID: ', CHAR_ID);
        }, 2000);  // 2000 milliseconds equals 2 seconds

        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.id && node.id.startsWith('headlessui-menu-items')) {
                            if  (isTargetUrl()){
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

    
})();
