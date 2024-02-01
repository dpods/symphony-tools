const config = {
    debug: true
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> background ${message}`, ...context)
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debug('received message', { action: request.action })
    switch (request.action) {
        case 'add_tags':
            sendMessage('add_tags')
            break
        case 'remove_tags':
            sendMessage('remove_tags')
            break
    }
});

const sendMessage = (message) => {
    debug('sending message', { message: message })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // Send a message to the isolated content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, { message: message }, (resp) => {});
    });
}