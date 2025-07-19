/**
 * Moescape/Yodayo Chat Customizer Entry Point
 *
 * This script injects custom UI and menu items into the chat pages of Moescape and Yodayo.
 * It observes URL changes and DOM mutations to dynamically add or remove custom elements.
 *
 * @file JS entry point for the Yodayo/Moescape Chat Customizer userscript.
 * @author 
 * @version 1.0.0
 * @license MIT
 */

// YCC Entry Point
(async function () {
    'use strict';

    console.log('Chat Customizer script initialized.');
    let scriptLoaded = false;
    let urlCheckInterval = null;
    let menuItemsAdded = false;
    let observer = null;
    
    /**
     * Checks if the current URL matches the target chat page pattern.
     * @returns {boolean} True if on a supported chat page, false otherwise.
     */
    function isTargetUrl() {
        return location.href.startsWith('https://moescape.ai/tavern/chat/') || location.href.startsWith('https://yodayo.com/tavern/chat/');
    }

    /**
     * Hides and removes elements by their DOM IDs.
     * @param {...string} ids - The IDs of elements to hide/remove.
     * @returns {void}
     */
    function hideElementsById(...ids) {
        ids.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }

    /**
     * Shows elements by their DOM IDs (sets display to 'block').
     * @param {...string} ids - The IDs of elements to show.
     * @returns {void}
     */
    function showElementsById(...ids) {
        ids.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'block';
            }
        });
    }

    /**
     * Initializes the script, sets up observers and menu items if on a target URL.
     * @returns {void}
     */
    function initializeScript() {
        if (isTargetUrl()) {
            if (!scriptLoaded) {
                scriptLoaded = true;
                // Place your script's main logic here
                console.log('Moescape Chat Customizer script is running');
                waitForElement(char_id_selector, onLoad);

            }
        } else if (!isTargetUrl() && scriptLoaded) {
            console.log('Exited chat page, hiding menu items.');
            scriptLoaded = false; // Reset scriptLoaded flag
            menuItemsAdded = false; // Reset menu items flag so they are re-added on next chat
            if (observer) { observer.disconnect(); observer = null; }
            hideElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);
        }
    }

    // Variable to keep track of the last URL
    let lastUrl = location.href;
    initializeScript();

    /**
     * Checks for URL changes and re-initializes the script if needed.
     * @returns {void}
     */
    function checkUrlChange() {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            initializeScript();
            lastUrl = currentUrl;
        }
    }

    // Set up a popstate event listener to handle browser navigation events
    window.addEventListener('popstate', checkUrlChange);

    // Periodically check for URL changes (reduced frequency for better performance)
    urlCheckInterval = setInterval(checkUrlChange, 250); // Changed from 1000ms to 2000ms

    /**
     * Adds custom menu items to the provided menu element.
     * @param {HTMLElement} menu - The menu DOM element to add items to.
     * @returns {void}
     */
    function addCustomizeMenuItems(menu) {
        addMenuItem(menu, chat_customizer_html_element_id, customize_chat_button_html_resource_name)
            .then(chatCustomizeButton => {
                if (chatCustomizeButton) {
                    chatCustomizeButton.addEventListener('click', () =>
                        addCustomizeChatForm(chat_customizer_body_id, chat_customizer_body_resource_name));

                    // Create a new observer
                    let formAdded_observer = new MutationObserver(handleFormAdded);
                    // Start observing the body for changes
                    formAdded_observer.observe(document.body, { childList: true, subtree: true });
                }

                // Chain the next promise
                return addMenuItem(menu, db_explorer_html_element_id, db_connect_button_html_resource_name);
            })
            .then(dbConnectButton => {
                if (dbConnectButton) {
                    dbConnectButton.addEventListener('click', () =>
                        addImageViewer(db_explorer_body_id, image_viewer_popup_resource_name));
                }
            })
            .catch(error => {
                console.error('Error adding menu items:', error);
            });
    }

    /**
     * Callback for when the main chat element is loaded.
     * @param {HTMLElement} element - The chat DOM element.
     * @returns {Promise<void>}
     */
    async function onLoad(element) {
        console.log('Page loaded');

        let CHAR_ID = findCharacterID(element);
        console.log('Char ID: ', CHAR_ID);
        let anchor = document.querySelector(char_id_selector);
        if (!CHAR_ID) CHAR_ID = CHAT_ID;
        await loadCustomizedUI(CHAR_ID);
        showInjectionNotification(notification_resource_name, CHAR_ID);
        // Add Alt + Shift + / keyboard shortcut to open chat customizer popup
        window.addEventListener('keydown', function(e) {
            // Fix: use e.code for '/' key and check for focus on input/textarea
            if (e.altKey && e.shiftKey && (e.key === '/' || e.code === 'Slash')) {
                // Prevent default if not in input/textarea
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
                    return;
                }
                addCustomizeChatForm(chat_customizer_body_id, chat_customizer_body_resource_name);
                // Create a new observer
                let formAdded_observer = new MutationObserver(handleFormAdded);
                // Start observing the body for changes
                formAdded_observer.observe(document.body, { childList: true, subtree: true });
            }
        });
        if (!menuItemsAdded){ 
            observer = new MutationObserver((mutations) => {
                if (isTargetUrl()) {
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            mutation.addedNodes.forEach(node => {
                                if (node.id && node.id.startsWith('headlessui-menu-items')) {
                                    addCustomizeMenuItems(node);
                                    menuItemsAdded = true;

                                }
                            });
                        }
                    }
                }
            });
            const config = { childList: true, subtree: true };
            observer.observe(document.body, config);
        }

        if (menuItemsAdded) {
            showElementsById(chat_customizer_html_element_id, db_explorer_html_element_id);
        }  
  
    }

    // Clean up event listeners and intervals when the script is unloaded
    window.addEventListener('unload', () => {
        window.removeEventListener('popstate', checkUrlChange);
        clearInterval(urlCheckInterval);
        if (observer) { observer.disconnect(); }
    });

    

})();
