const config = {
    debug: true
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> content-isolated ${message}`, ...context)
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    debug('received message', { message: request.message })
    switch (request.message) {
        case 'add_tags': {
            window.dispatchEvent(new CustomEvent('get_symphony_json', {
                detail: {
                    action: 'add_tags'
                }
            }))
            break
        }
        case 'remove_tags': {
            window.dispatchEvent(new CustomEvent('get_symphony_json', {
                detail: {
                    action: 'remove_tags'
                }
            }))
            break
        }
    }
});

window.addEventListener('symphony_json_result', (event) => {
    debug('received message', { action: event.detail.action })
    switch (event.detail.action) {
        case 'add_tags': {
            const taggedSymphony = tagSymphony(event.detail.symphony)
            window.dispatchEvent(new CustomEvent('set_symphony_json', {
                detail: taggedSymphony
            }))
            break
        }
        case 'remove_tags': {
            const taggedSymphony = untagSymphony(event.detail.symphony)
            window.dispatchEvent(new CustomEvent('set_symphony_json', {
                detail: taggedSymphony
            }))
            break
        }
    }
})

function tagSymphony(json) {
    let depth = 0

    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    function tag(json) {
        if (isAssetNode(json)) {
            depth += 1
            json['name'] = json['name'] ?? ''

            if (/^\[[0-9]+\]?(.*)/.test(json['name'])) {
                const matches = json['name'].match(/^\[[0-9]+\]?(.*)/)
                json['name'] = `[${depth}] ${matches[1].trim()}`
            } else {
                json['name'] = `[${depth}] ${json['name'] ?? ''}`
            }
        }

        if (json['children'] !== undefined) {
            const children = []
            for (const child of json['children']) {
                children.push(tag(child))
            }
            json['children'] = children
        }

        return json
    }

    return tag(json)
}

function untagSymphony(json) {
    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    function untag(json) {
        if (isAssetNode(json)) {
            if (/^\[[0-9]+\]?(.*)/.test(json['name'])) {
                const matches = json['name'].match(/^\[[0-9]+\]?(.*)/)
                json['name'] = `${matches[1].trim()}`
            }
        }

        if (json['children'] !== undefined) {
            const children = []
            for (const child of json['children']) {
                children.push(untag(child))
            }
            json['children'] = children
        }

        return json
    }

    return untag(json)
}
