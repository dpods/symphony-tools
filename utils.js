import config from './config'

export const debug = (message, ...context) => {
    if (config.debug) {
        console.log(`>>> ${message}`, ...context)
    }
}