chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    console.log('AAA')
    if(request.action === "tag_symphony") {
        console.log('BBB')
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            console.log('CCC')
            // Send a message to the content script in the active tab
            chrome.tabs.sendMessage(tabs[0].id, { message: "get_symphony_json" }, (resp) => {
                console.log('DDD', resp)
                // chrome.tabs.query({ active: true }, function(tabs) {
                //     console.log('EEE')
                //     sendResponse({ result: 'success' });
                // });
            });
        });
    }
});