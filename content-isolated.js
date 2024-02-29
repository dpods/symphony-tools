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
        case 'find': {
            window.dispatchEvent(new CustomEvent('get_symphony_json', {
                detail: {
                    action: 'find',
                    find: request.data.find,
                }
            }))
            break
        }
        case 'find_and_replace': {
            window.dispatchEvent(new CustomEvent('get_symphony_json', {
                detail: {
                    action: 'find_and_replace',
                    find: request.data.find,
                    replace: request.data.replace
                }
            }))
            break
        }
    }
    return true
}

chrome.runtime.onMessage.addListener(background2Listener);

window.addEventListener('symphony_json_result', (event) => {
    debug('received message', { detail: event.detail })
    switch (event.detail.action) {
        case 'remove_metadata': {
            const modifiedSymphony = removeMetadata(event.detail.symphony)
            window.dispatchEvent(new CustomEvent('set_symphony_json', {
                detail: modifiedSymphony
            }))
            break
        }
        case 'find': {
            const occurances = find(event.detail.symphony, event.detail.find)
            debug('sending result', { occurances })
            chrome.runtime.sendMessage({
                action: "find_result",
                data: {
                    occurances: occurances
                }
            });
            break
        }
        case 'find_and_replace': {
            const modifiedSymphony = findAndReplace(event.detail.symphony, event.detail.find, event.detail.replace)
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

function find(json, find) {
    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    function isIfNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'if-child'
    }

    function isMatch(json, find) {
        return json.hasOwnProperty('ticker') && json['ticker'].toUpperCase() === find.toUpperCase()
    }

    function isLhsMatch(json, find) {
        return json.hasOwnProperty('lhs-val') && json['lhs-val'].toUpperCase() === find.toUpperCase()
    }

    function isRhsMatch(json, find) {
        return json.hasOwnProperty('rhs-val') && json['rhs-val'].toUpperCase() === find.toUpperCase()
    }

    function findAndReplaceTicker(json, find, occurrances) {
        if (isAssetNode(json) && isMatch(json, find)) {
            occurrances.assets++
        }

        if (isIfNode(json)) {
            if (isLhsMatch(json, find)) {
                occurrances.conditionals++
            }
            if (isRhsMatch(json, find)) {
                occurrances.conditionals++
            }
        }

        if (json['children'] !== undefined) {
            for (const child of json['children']) {
                occurrances = findAndReplaceTicker(child, find, occurrances)
            }
        }

        return occurrances
    }

    return findAndReplaceTicker(json, find, {assets: 0, conditionals: 0})
}

function findAndReplace(json, find, replace) {
    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    function isIfNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'if-child'
    }

    function isMatch(json, find) {
        return json.hasOwnProperty('ticker') && json['ticker'].toUpperCase() === find.toUpperCase()
    }

    function isLhsMatch(json, find) {
        return json.hasOwnProperty('lhs-val') && json['lhs-val'].toUpperCase() === find.toUpperCase()
    }

    function isRhsMatch(json, find) {
        return json.hasOwnProperty('rhs-val') && json['rhs-val'].toUpperCase() === find.toUpperCase()
    }

    function findAndReplaceTicker(json, find, replace) {
        if (isAssetNode(json) && isMatch(json, find)) {
            delete json['name']
            delete json['exchange']
            json['ticker'] = replace.toUpperCase()
        }

        if (isIfNode(json)) {
            if (isLhsMatch(json, find)) {
                json['lhs-val'] = replace.toUpperCase()
            }
            if (isRhsMatch(json, find)) {
                json['rhs-val'] = replace.toUpperCase()
            }
        }

        if (json['children'] !== undefined) {
            const children = []
            for (const child of json['children']) {
                children.push(findAndReplaceTicker(child, find, replace))
            }
            json['children'] = children
        }

        return json
    }

    return findAndReplaceTicker(json, find, replace)
}
