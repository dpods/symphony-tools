const config = {
    debug: true
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> background ${message}`, ...context)
    }
}

const backgroundListener = (request, sender, sendResponse) => {
    debug('received message', { request })
    switch (request.action) {
        case 'remove_metadata': {
            sendMessage('remove_metadata')
            break
        }
        case 'find': {
            sendMessage('find', {
                find: request.find,
            })
            break
        }
        case 'find_result': {
            sendResultToPopup('find', {
                occurances: request.data.occurances,
            })
            break
        }
        case 'find_and_replace': {
            sendMessage('find_and_replace', {
                find: request.find,
                replace: request.replace
            })
            break
        }
    }
    return true;
}

const sendMessage = (message, data = {}) => {
    debug('sending message', { message, data })
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // Send a message to the isolated content script in the active tab
        chrome.tabs.sendMessage(tabs[0].id, { message: message, data: data }, (resp) => {
            sendResultToPopup(resp.action, resp.data)
        });
    });
}

const sendResultToPopup = (message, data = {}) => {
    debug('sending result to popup', { message, data })
    chrome.runtime.sendMessage({
        message: "find_result",
        data: data
    });
}

chrome.runtime.onMessage.addListener(backgroundListener);