document.addEventListener("DOMContentLoaded", function() {
    console.log('>>> loaded')

    document.getElementById('removeMetadata').addEventListener('click', function() {
        console.log('>>> click removeMetadata')
        chrome.runtime.sendMessage({ action: 'remove_metadata' }, (response) => {});
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
});