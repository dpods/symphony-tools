const config = {
    debug: true
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> content-isolated ${message}`, ...context)
    }
}

const background2Listener = function (request, sender, sendResponse) {
    debug('received message', { message: request.message })
    switch (request.message) {
        case 'remove_metadata': {
            window.dispatchEvent(new CustomEvent('get_symphony_json', {
                detail: {
                    action: 'remove_metadata'
                }
            }))
            break
        }
    }
    return true
}

chrome.runtime.onMessage.addListener(background2Listener);

window.addEventListener('symphony_json_result', (event) => {
    debug('received message', { action: event.detail.action })
    switch (event.detail.action) {
        case 'remove_metadata': {
            const modifiedSymphony = removeMetadata(event.detail.symphony)
            window.dispatchEvent(new CustomEvent('set_symphony_json', {
                detail: modifiedSymphony
            }))
            break
        }
    }
})

function removeMetadata(json) {
    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    function removeMetadataFromAsset(json) {
        if (isAssetNode(json)) {
            delete json['name']
            delete json['exchange']
        }

        if (json['children'] !== undefined) {
            const children = []
            for (const child of json['children']) {
                children.push(removeMetadataFromAsset(child))
            }
            json['children'] = children
        }

        return json
    }

    return removeMetadataFromAsset(json)
}
