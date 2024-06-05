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
    const char_name_input = form.getElementbyId('name-input');
    const char_name_color_input = form.getElementbyId('name-color-input');
    const char_bg_url_input = form.getElementbyId('character-image-url-input');
    const char_bg_file_input = form.getElementbyId('character-image-file-input');

    const bg_url_input = form.getElementbyId('bg-url-input');
    const bg_file_input = form.getElementbyId('bg-file-input');

    const char_narr_input = form.getElementbyId('character-narration-color-input');
    const char_chat_input = form.getElementbyId('character-chat-color-input');
    const user_chat_input = form.getElementbyId('user-chat-color-input');
    const char_chat_bg_input = form.getElementbyId('character-chat-bg-color-input');
    const user_chat_bg_input = form.getElementbyId('user-chat-bg-color-input');

    const apply_to_all = form.getElementbyId('apply-to-all');
    const exclude_curr_chat = form.getElementbyId('exlude-current-chat')
    
    
    const name = document.querySelector(char_character_name);

    name_input.addEventListener('input', function () {
        // Update the character name element with the value from the input field
        name.textContent = name_input.value;
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
                // Attach event listener to the close button
                initializeCloseButtonEventHandler(form);
                initializeCharacterSettingsEventHandlers(form);
                // Disconnect the observer once the form is found
                observer.disconnect();
                break;
            }
        }
    }
}

// Create a new observer
const observer = new MutationObserver(handleFormAdded);

// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true });
