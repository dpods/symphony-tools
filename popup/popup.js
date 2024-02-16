document.addEventListener("DOMContentLoaded", function() {
    console.log('>>> loaded')

    document.getElementById('removeMetadata').addEventListener('click', function() {
        console.log('>>> click removeMetadata')
        chrome.runtime.sendMessage({ action: 'remove_metadata' }, (response) => {});
    });
});