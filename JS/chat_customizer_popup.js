// Function to handle when the form is added
function handleFormAdded(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if the form is added
            form = document.querySelector('#chat-customizer-ui-popup')
            if (form) {

                console.log('Form Found.');
                const closeButton = document.getElementById('close-button');
                const dialog = document.getElementById('headlessui-dialog-:r1f:');

                closeButton.addEventListener('click', () => {
                    // Hide the modal by removing the open attribute
                    dialog.removeAttribute('data-headlessui-state');
                });


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
