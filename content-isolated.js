chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('111a')
    if (request.message === "get_symphony_json") {
        console.log('222a')
        window.dispatchEvent(new CustomEvent('tagger_get_symphony_json'))
        console.log('dispatched CustomEvent(tagger_get_symphony_json)')
    }
});

window.addEventListener('tagger_return_symphony_json', (event) => {
    console.log('received CustomEvent(tagger_return_symphony_json)')
    console.log('====', event.detail)

    const taggedSymphony = tagSymphony(event.detail)

    window.dispatchEvent(new CustomEvent('tagger_set_symphony_json', {
        detail: taggedSymphony
    }))
})
console.log('registered event listener (tagger_return_symphony_json)')

function tagSymphony(json) {
    console.log('>>> 1')
    let depth = 0

    function tag(json) {
        if (isAssetNode(json)) {
            depth += 1
            json['name'] = `[${depth}] ${json['name'] ?? ''}`
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

    function isAssetNode(json) {
        return json.hasOwnProperty('step') && json['step'] === 'asset'
    }

    return tag(json)
}
