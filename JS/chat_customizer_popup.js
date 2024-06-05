function setupChatCustomizerEventListeners(){
    form = document.querySelector('#chat-customizer-ui-popup');
    closeButton = form.querySelector('#close-button');

    closeButton.addEventListener('click', () => {
        form.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
    });
}