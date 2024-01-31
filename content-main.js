window.addEventListener('tagger_get_symphony_json', (event) => {
    console.log('received CustomEvent(tagger_get_symphony_json)')
    window.dispatchEvent(new CustomEvent('tagger_return_symphony_json', {
        detail: window.cli.getSymphonyJson()
    }))
    console.log('dispatched CustomEvent(tagger_return_symphony_json)')
})
console.log('registered event listener (tagger_get_symphony_json)')

window.addEventListener('tagger_set_symphony_json', (event) => {
    console.log('received CustomEvent(tagger_set_symphony_json)')
    window.cli.createSymphonyFromJson(event.detail)
})
console.log('registered event listener (tagger_set_symphony_json)')

// chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
//     if (msg.action === 'tag_symphony') {
//         console.log('>>> 4')
//         console.log(window.cli.help())
//     }
// });

// function tagSymphony() {
//     console.log('>>> 1')
//     let depth = 0
//
//     function tag(json) {
//         if (isAssetNode(json)) {
//             this.depth += 1
//             json['name'] = `[${this.depth}] ${json['name']}`
//         }
//
//         if (json['children'] !== undefined) {
//             const children = []
//             for (const child of json['children']) {
//                 children.push(this.tag(child))
//             }
//             json['children'] = children
//         }
//
//         return json
//     }
//
//     function isAssetNode(json) {
//         const isAsset = json.hasOwnProperty('step') && json['step'] === 'asset'
//         const hasName = json.hasOwnProperty('name') && json['name'] !== undefined
//         return isAsset && hasName
//     }
//
//     console.log('>>> 2')
//     const json = window.cli.getSymphonyJson()
//     console.log('>>> 3')
//     const taggedJson = tag(json)
//     console.log('>>> 4')
//     window.cli.createSymphonyFromJson(taggedJson)
//     console.log('>>> 5')
// }
