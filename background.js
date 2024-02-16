const config = {
    debug: true
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> background ${message}`, ...context)
    }
}

const backgroundListener = (request, sender, sendResponse) => {
    debug('received message', { action: request.action })
    switch (request.action) {
        case 'remove_metadata':
            sendMessage('remove_metadata')
            break
    }
    return true;
}

const sendMessage = (message) => {
    debug('sending message', { message: message })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // Send a message to the isolated content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, { message: message }, (resp) => {});
    });
}

chrome.runtime.onMessage.addListener(backgroundListener);