(async function () {
    'use strict';

    console.log('Chat Customizer script initialized.');
    
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
            scriptLoaded = true;
            // Place your script's main logic here
            console.log('Yodayo Chat Customizer script is running');
            
            setTimeout(() => {
                onLoad();
            }, 2000);  // 2000 milliseconds equals 2 seconds

            console.log('Event listener for window load added.');
        }
        else if(!isTargetUrl() && scriptLoaded === true){
            console.log('Exited chat page, hiding menu items.');
            hideElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);

        }
        console.log('Not a chat page, Yodayo Chat Customizer not running...');
    }

    // Initial check when the script loads
    initializeScript();

    // Set up a MutationObserver to detect URL changes
    const page_observer = new MutationObserver(() => {
        if (isTargetUrl()) {
            // If the URL matches, re-initialize the script
            initializeScript();
        }
    });

    // Observe changes to the document's title and URL
    page_observer.observe(document, { subtree: true, childList: true });

    
    
    function addCustomizeMenuItems(menu) {
        Promise.all([
            addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name),
            addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name)
        ]).then(([chatCustomizeButton, dbConnectButton]) => {
            const target_element = '#headlessui-portal-root';
            if (chatCustomizeButton) {
                chatCustomizeButton.addEventListener('click', () => 
                    addCustomizeChatForm(target_element, chat_customizer_body_id, chat_customizer_body_resource_name));
                    // setupChatCustomizerEventListeners();
            }

            if (dbConnectButton) {
                dbConnectButton.addEventListener('click', () => 
                    addImageViewer(target_element, db_explorer_body_id, image_viewer_popup_resource_name));
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

                            
                            console.log('Menu appeared. Node:', node);
                            addCustomizeMenuItems(node);

                        }
                    });
                }
            }
        });

        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
        console.log('MutationObserver started.');
    }

    
})();
