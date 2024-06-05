(async function () {
    'use strict';

    console.log('Chat Customizer script started.');
    
    function addCustomizeMenuItems(menu) {
        Promise.all([
            addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name),
            addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name)
        ]).then(([chatCustomizeButton, dbConnectButton]) => {
            const target_element = '[data-floating-ui-portal]';
            if (chatCustomizeButton) {
                chatCustomizeButton.addEventListener('click', () => 
                    addCustomizeChatForm(target_element, chat_customizer_body_id, chat_customizer_body_resource_name));
                    
            }

            if (dbConnectButton) {
                dbConnectButton.addEventListener('click', () => 
                    addImageViewer(target_element, db_explorer_body_id, image_viewer_popup_resource_name));
            }
        });
    }
    
    function onLoad() {
        console.log('Page loaded');
        const CHAR_ID = findCharacterID();
        console.log('Char ID: ', CHAR_ID);

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

    window.addEventListener('load', onLoad);

    console.log('Event listener for window load added.');
})();
