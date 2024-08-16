const debugMode = true;

const boundLog = console.log.bind(console, "[composer-quant-tools]");

export const log = debugMode ? boundLog : () => {};