
// this is a really silly hack due to chrome not giving us the extension id from chrome.runtime.id
function getCurrentExtensionId() {
    try {
        throw new Error();
    } catch (e) {
        // The stack property contains the error stack trace
        if (e.stack) {
            // Extract the URL from the stack trace
            let stackLines = e.stack.split('\n');
            let scriptUrl = stackLines[1]; // Depending on the browser, you might need to adjust this index
            let matches = scriptUrl.match(/\((.*?):\d+:\d+\)$/);
            if (matches) {
                matches = matches[1].match(/\/\/([^\/]*)\//)
                return matches ? matches[1] : null; // This is the id of the currently executing extension
            }
        }
    }
    return null;
}

const extensionId = getCurrentExtensionId();

async function sendToken () {
    let token = await cli.getTemporaryToken();
    chrome.runtime.sendMessage(extensionId, { action: 'onToken', token });
    setTimeout(sendToken, 1000 * 60 * 10); // refresh token every 10 minutes
}

const waitForDom = async () => {
  const observer = new MutationObserver(async function (mutations, mutationInstance) {
      const mainEl = document.getElementsByTagName('main')[0]
      if (mainEl) {
          sendToken();
          mutationInstance.disconnect();
      }
  });
  observer.observe(document, { childList: true, subtree: true});
}
waitForDom();