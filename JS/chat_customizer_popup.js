function initializeCustomChatCloseButtonEventHandler(form){
    const closeButton = form.querySelector('#close-button');
    closeButton.addEventListener('click', () => {
        document.documentElement.style.cssText = '';

        const main = document.querySelector('body > main');
        main.setAttribute('aria-hidden', 'false');
        main.removeAttribute('inert');

        form.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
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
                initializeCustomChatCloseButtonEventHandler(form);
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
