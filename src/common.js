const debugMode = true

const log = (...data) => {
    console.log('[symphony-tools-extension]', ...data)
}

const debug = (...data) => {
    if (debugMode) {
        log(...data)
    }
}