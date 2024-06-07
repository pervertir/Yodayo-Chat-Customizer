function seperateUserNameAndText() {
    // Select all elements with the class 'text-xs font-medium opacity-50' for usernames
    const usernameElements = document.querySelectorAll('p.text-xs.font-medium.opacity-50');
    usernameElements.forEach((element) => {
        element.classList.add('username');
    });

    // Select all elements that match the structure of a message
    const messageElements = document.querySelectorAll('p.space-x-1 > span');
    messageElements.forEach((element) => {
        element.classList.add('message');
    });
}


function handleNewUserNameAndText(event) {
    const node = event.target;

    if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('p.text-xs.font-medium.opacity-50')) {
            node.classList.add('username');
        } else if (node.matches('p.space-x-1 > span')) {
            node.classList.add('message');
        }
    }
}


function initializeCloseButtonEventHandler(form){
    const closeButton = form.querySelector('#close-button');
    closeButton.addEventListener('click', () => {
        document.documentElement.style.cssText = '';

        const main = document.querySelector('body > main');
        main.setAttribute('aria-hidden', 'false');
        main.removeAttribute('inert');

        form.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
    });
}

function initializeCharacterSettingsEventHandlers(form){
    const char_name_input = form.querySelector('#name-input');
    const char_name_color_input = form.querySelector('#name-color-input');
    const char_image_url_input = form.querySelector('#character-image-url-input');
    const char_image_file_input = form.querySelector('#character-image-file-input');

    const bg_url_input = form.querySelector('#bg-url-input');
    const bg_file_input = form.querySelector('#bg-file-input');

    const char_narr_input = form.querySelector('#character-narration-color-input');
    const char_chat_input = form.querySelector('#character-chat-color-input');
    const user_chat_input = form.querySelector('#user-chat-color-input');
    const char_chat_bg_input = form.querySelector('#character-chat-bg-color-input');
    const user_chat_bg_input = form.querySelector('#user-chat-bg-color-input');
    const user_name_color_input = form.querySelector('#user-name-color-input');

    const apply_to_all = form.querySelector('#apply-to-all');
    const exclude_curr_chat = form.querySelector('#exlude-current-chat')
    

    char_name_input.addEventListener('input', function () {
        
        names.forEach(name => {
            name.textContent = char_name_input.value;
        });
    });

    user_chat_input.addEventListener('input', function(){
        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    if (rule.selectorText === '.message') {
                        // Change the color property to red
                        rule.style.color = user_chat_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }
    });

    user_name_color_input.addEventListener("input", function(){
        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    if (rule.selectorText === '.username') {
                        // Change the color property to red
                        rule.style.color = user_user_name_color_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }
    });

    char_chat_bg_input.addEventListener('input', function(){

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    if (rule.selectorText === '.bg-black\\/\\[\\.85\\]') {
                        // Change the color property to red
                        rule.style.backgroundColor = char_chat_bg_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }
        
    });



    char_name_color_input.addEventListener('input', function(){

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    // Check if the rule is for the .text-chipText class
                    if (rule.selectorText === '.opacity-50') {
                        // Change the color property to red
                        rule.style.opacity = 1;
                    }
                    if (rule.selectorText === 'a') {
                        // Change the color property to red
                        rule.style.color = char_name_color_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }

    });


    char_narr_input.addEventListener('input', function () {
        
        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    // Check if the rule is for the .text-chipText class
                    if (rule.selectorText === '.text-chipText') {
                        // Change the color property to red
                        rule.style.color = char_narr_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }

    });


    char_chat_input.addEventListener('input', function () {

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    const rule = styleSheet.cssRules[j];

                    // Check if the rule is for the .text-chipText class
                    if (rule.selectorText === '.text-primaryText\\/90') {
                        // Change the color property to red
                        rule.style.color = char_chat_input.value;
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                continue;
            }
        }
        
    });



}


// Function to handle when the form is added
function handleFormAdded(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if the form is added
            form = document.querySelector('#headlessui-portal-root')
            if (form) {

                console.log('Form Found.');
                // Disconnect the observer once the form is found
                observer.disconnect();
                
                // Add classes to existing elements
                seperateUserNameAndText();
                
                // Listen for new elements being added
                document.addEventListener('DOMNodeInserted', handleNewUserNameAndText);

                // Attach event listener to the close button
                initializeCloseButtonEventHandler(form);

                // Attach event listener to all form parameters
                initializeCharacterSettingsEventHandlers(form);
                
                // break;
            }
        }
    }
}

// Create a new observer
const observer = new MutationObserver(handleFormAdded);

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
