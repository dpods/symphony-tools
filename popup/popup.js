document.addEventListener("DOMContentLoaded", function() {
    const findResults = document.getElementById('findResults')
    const findResultsAssets = document.getElementById('findResultsAssets')
    const findResultsIfElse = document.getElementById('findResultsIfElse')

    document.getElementById('removeMetadata').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'remove_metadata' }, (response) => {});
    });

    document.getElementById('find').addEventListener('input', function (evt) {
        this.value = this.value.toUpperCase()

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

    document.getElementById('replace').addEventListener('input', function (evt) {
        this.value = this.value.toUpperCase()
    });

    document.getElementById('findAndReplace').addEventListener('click', function() {
        const find = document.getElementById('find').value
        const replace = document.getElementById('replace').value
        chrome.runtime.sendMessage({
            action: 'find_and_replace',
            find: find,
            replace: replace
        }, (response) => {});
    });

    chrome.runtime.onMessage.addListener(
        function(resp, sender, sendResponse) {
            findResultsAssets.innerHTML = resp.data.occurances.assets
            findResultsIfElse.innerHTML = resp.data.occurances.conditionals
        }
    );
});