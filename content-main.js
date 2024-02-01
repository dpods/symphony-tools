const config = {
    debug: false
}

const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> content-main ${message}`, ...context)
    }
}

window.addEventListener('get_symphony_json', (event) => {
    debug('received event', event)
    const e = new CustomEvent('symphony_json_result', {
        detail: {
            action: event.detail.action,
            symphony: window.cli.getSymphonyJson()
        }
    })
    debug('dispatching event', e)
    window.dispatchEvent(e)
})

window.addEventListener('set_symphony_json', (event) => {
    debug('received event', event)
    window.cli.createSymphonyFromJson(event.detail)
})