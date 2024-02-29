document.addEventListener("DOMContentLoaded", function() {
    console.log('>>> loaded')

    const findResults = document.getElementById('findResults')
    const findResultsAssets = document.getElementById('findResultsAssets')
    const findResultsIfElse = document.getElementById('findResultsIfElse')

    document.getElementById('removeMetadata').addEventListener('click', function() {
        console.log('>>> click removeMetadata')
        chrome.runtime.sendMessage({ action: 'remove_metadata' }, (response) => {});
    });

    document.getElementById('find').addEventListener('input', function (evt) {
        console.log('>>> sending find event', {
            action: 'find',
            find: this.value,
        })

        if (this.value === '') {
            findResults.classList.add('invisible')
        } else {
            chrome.runtime.sendMessage({
                action: 'find',
                find: this.value,
            }, (resp) => {});
            findResults.classList.remove('invisible')
        }
    });

    document.getElementById('findAndReplace').addEventListener('click', function() {
        console.log('>>> click findAndReplace')
        const find = document.getElementById('find').value
        const replace = document.getElementById('replace').value
        console.log('>>>', {
            find: find,
            replace: replace
        })
        chrome.runtime.sendMessage({
            action: 'find_and_replace',
            find: find,
            replace: replace
        }, (response) => {});
    });

    chrome.runtime.onMessage.addListener(
        function(resp, sender, sendResponse) {
            console.log('>>> received response', {
                resp: resp
            })
            findResultsAssets.innerHTML = resp.data.occurances.assets
            findResultsIfElse.innerHTML = resp.data.occurances.conditionals
        }
    );
});