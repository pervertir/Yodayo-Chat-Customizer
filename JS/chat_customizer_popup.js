

async function setBackgroundImage(imageBase64) {
    let targetDivs = document.querySelectorAll('.bg-cover, .bg-primaryBg');
    if (!targetDivs.length) {
        console.error('Background divs not found.');
        return;
    }
    let divElements = Array.from(targetDivs).filter((element) => element.tagName === 'DIV');

    console.log('Setting new background image');
    divElements.forEach((targetDiv) => {
        targetDiv.style.backgroundImage = `url('data:image;base64,${imageBase64}')`;
        targetDiv.style.backgroundSize = 'cover';
        targetDiv.classList.remove('container');
    });

}

async function setCharacterImage(imageBase64) {
    setTimeout(async function () { // Ensuring the timeout waits for 2 seconds before executing the code within
        console.log('Wait for 2 seconds for page to load.');

        let characterContainer = document.querySelector('.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2');

        if (characterContainer) {
            // Check if character image already exists
            let existingImage = characterContainer.querySelector('div > div > img');

            if (existingImage) {
                // Change the existing character image if different
                existingImage.src = `data:image;base64,${imageBase64}`;
                existingImage.style.height = "90vh";
                console.log('Changed Character Image.');
                
            } else { // If there is no existing Character image
                // Ensure that the nested divs exist
                let innerDiv = characterContainer.querySelector('div > div');
                if (!innerDiv) {
                    renderHTMLFromFile(character_image_container_resource_name).then(character_image_container => {
                        image = character_image_container.querySelector('img');
                        image.src = `data:image;base64,${imageBase64}`;
                        image.style.height = "90vh";
                        characterContainer.appendChild(character_image_container);
                    });
                }
            }
        } else {
            console.error('Character container not found');
        }
    }, 1000); // Delay of 2 seconds
}


// function seperateUserNameAndText() {
//     // Select all elements with the class 'text-xs font-medium opacity-50' for usernames
//     let usernameElements = document.querySelectorAll('p.text-xs.font-medium.opacity-50');
//     usernameElements.forEach((element) => {
//         element.classList.add('username');
//     });

//     // Select all elements that match the structure of a message
//     let messageElements = document.querySelectorAll('.flex.items-end.gap-2.ml-3.flex-row-reverse > .relative.flex.w-full.items-start.justify-between.rounded-xl.border.px-3.pb-2.pt-1.text-sm.backdrop-blur-sm.md\\:w-\\[70\\%\\].bg-primaryText\\=\\[85\\%\\].text-black.border-transparent > .w-full > .mb-1.flex.items-center.justify-between.gap-4 > .space-y-1\\.5.break-words.pr-8 > p.space-x-1');
//      messageElements.forEach((element) => {
//         element.classList.add('message');
//     });
// }

// // Function to handle mutations
// function handleMutations(mutationsList) {
//     for (let mutation of mutationsList) {
//         if (mutation.type === 'childList') {
//             mutation.addedNodes.forEach((node) => {
//                 if (node.nodeType === Node.ELEMENT_NODE) {
//                     if (node.matches('p.text-xs.font-medium.opacity-50')) {
//                         node.classList.add('username');
//                     } else if (node.matches('.flex.items-end.gap-2.ml-3.flex-row-reverse > .relative.flex.w-full.items-start.justify-between.rounded-xl.border.px-3.pb-2.pt-1.text-sm.backdrop-blur-sm.md\\:w-\\[70\\%\\].bg-primaryText\\=\\[85\\%\\].text-black.border-transparent > .w-full > .mb-1.flex.items-center.justify-between.gap-4 > .space-y-1\\.5.break-words.pr-8 > p.space-x-1')) {
//                         node.classList.add('message');
//                     }
//                 }

//                 //If the added node has children, we need to recursively check those as well
//                 node.querySelectorAll && node.querySelectorAll('p.text-xs.font-medium.opacity-50, p.space-x-1 > span').forEach((child) => {
//                     if (child.matches('p.text-xs.font-medium.opacity-50')) {
//                         child.classList.add('username');
//                     } else if (child.matches('p.space-x-1 > span')) {
//                         child.classList.add('message');
                    
//                     }
//                 });
//             });
//         }
//     }
// }


function initializeCloseButtonEventHandler(form) {
    const formBody = document.querySelector('#chat-customizer-ui-popup > div');

    const closeModal = () => {
        // document.documentElement.style.cssText = '';

        let main = document.querySelector('body > main');
        main.setAttribute('aria-hidden', 'false');
        main.removeAttribute('inert');

        form.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
        document.removeEventListener('click', handleClickOutside);
    };

    const handleClickOutside = (event) => {
        if (!formBody.contains(event.target)) {
            closeModal();
        }
    };

    let closeButton = form.querySelector('#close-button');
    closeButton.addEventListener('click', closeModal);

    // Add event listener to close modal on click outside
    document.addEventListener('click', handleClickOutside);
}

function initializeCharacterSettingsEventHandlers(form){
    
    let char_name_input = form.querySelector('#name-input');
    let char_name_color_input = form.querySelector('#name-color-input');
    let char_image_url_input = form.querySelector('#character-image-url-input');
    let char_image_file_input = form.querySelector('#character-image-file-input');

    let bg_url_input = form.querySelector('#bg-url-input');
    let bg_file_input = form.querySelector('#bg-file-input');

    let char_narr_input = form.querySelector('#character-narration-color-input');
    let char_chat_input = form.querySelector('#character-chat-color-input');
    let user_chat_input = form.querySelector('#user-chat-color-input');
    let char_chat_bg_input = form.querySelector('#character-chat-bg-color-input');
    let user_chat_bg_input = form.querySelector('#user-chat-bg-color-input');
    let user_name_color_input = form.querySelector('#user-name-color-input');

    let apply_to_all = form.querySelector('#apply-to-all');
    let exclude_curr_chat = form.querySelector('#exlude-current-chat')
    

    char_name_input.addEventListener('input', function () {
        const character_names = document.querySelectorAll(character_name_selector);
        console.log(character_names);
        character_names.forEach(name => {
            name.textContent = char_name_input.value;
        });
    });


    user_chat_input.addEventListener('input', function(){
        let style = document.createElement('style');
        style.nodeType = 'text/css';

        // Define the CSS rule for the .username class
        style.innerHTML = `.message { color: ${user_chat_input.value}; }`;

        // Append the style element to the head of the document
        document.head.appendChild(style);
    });


    user_name_color_input.addEventListener("input", function(){

        let style = document.createElement('style');
        style.nodeType = 'text/css';

        // Define the CSS rule for the .username class
        style.innerHTML = `.username { color: ${user_name_color_input.value} !important; }`;

        // Append the style element to the head of the document
        document.head.appendChild(style);
    });


    char_image_url_input.addEventListener('input', async function(){
        let url = char_image_url_input.value;
        let imageBase64 = await urlToBase64(url);
        setCharacterImage(imageBase64);
    });

    char_image_file_input.addEventListener('change', async function () {
        let url = char_image_file_input.files[0];
        let imageBase64 = await fileToBase64(url);
        setCharacterImage(imageBase64);
    });

    bg_url_input.addEventListener('input', async function () {
        let url = bg_url_input.value;
        let imageBase64 = await urlToBase64(url);
        setBackgroundImage(imageBase64);
    });

    bg_file_input.addEventListener('change', async function () {
        let url = bg_file_input.files[0];
        let imageBase64 = await fileToBase64(url);
        setBackgroundImage(imageBase64);
    });

    char_chat_bg_input.addEventListener('input', function () {
        // Define the exact selector string to match
        const exactSelector = '.bg-black/[85%], .bg-black/[.85]';

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            let styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                console.log('Skipping stylesheet:', styleSheet.href);
                continue; // Skip this stylesheet
            }

            console.log('Processing stylesheet:', styleSheet.href || 'inline');

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    let rule = styleSheet.cssRules[j];

                    if (rule.selectorText) {
                        // Check for exact match
                        if (rule.selectorText === exactSelector) {
                            console.log('Exact match found:', rule.selectorText);
                            // Change the background color property
                            rule.style.backgroundColor = char_chat_bg_input.value;
                        }
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                console.warn(e);
                continue;
            }
        }
    });

    user_chat_bg_input.addEventListener('input', function(){
        // Define the exact selector string to match
        const exactSelector = '.bg-primaryText\/\[85\%\]';

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            let styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                console.log('Skipping stylesheet:', styleSheet.href);
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    let rule = styleSheet.cssRules[j];

                    if (rule.selectorText) {
                        // Check for exact match
                        if (rule.selectorText === exactSelector) {
                            console.log('Exact match found:', rule.selectorText);
                            // Change the background color property
                            rule.style.backgroundColor = user_chat_bg_input.value;
                        }
                    }
                }
            } catch (e) {
                // Ignore errors for stylesheets we cannot access
                console.warn('Cannot access stylesheet: ', styleSheet.href);
                console.warn(e);
                continue;
            }
        }
    });


    char_name_color_input.addEventListener('input', function(){

        // Loop through all stylesheets
        for (let i = 0; i < document.styleSheets.length; i++) {
            let styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    let rule = styleSheet.cssRules[j];

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
            let styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    let rule = styleSheet.cssRules[j];

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
            let styleSheet = document.styleSheets[i];

            // Check if the stylesheet is the one we want to ignore
            if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
                continue; // Skip this stylesheet
            }

            try {
                // Loop through all rules in the stylesheet
                for (let j = 0; j < styleSheet.cssRules.length; j++) {
                    let rule = styleSheet.cssRules[j];

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
            let form = document.querySelector('#headlessui-portal-root');
            if (form) {
                console.log('Form Found.');

                // Add classes to existing elements
                // seperateUserNameAndText();

                // // Create an observer instance linked to the callback function
                // let usernameObserver = new MutationObserver(handleMutations);

                // // Start observing the target node for configured mutations
                // usernameObserver.observe(document.body, { childList: true, subtree: true });

                // Attach event listener to the close button
                initializeCloseButtonEventHandler(form);

                // Attach event listener to all form parameters
                initializeCharacterSettingsEventHandlers(form);

                // Disconnect the observer once the form is found
                observer.disconnect();
                break;
            }
        }
    }
}

// Create a new observer
let formAdded_observer = new MutationObserver(handleFormAdded);

// Start observing the body for changes
formAdded_observer.observe(document.body, { childList: true, subtree: true });
