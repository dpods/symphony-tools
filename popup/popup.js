document.addEventListener("DOMContentLoaded", function() {
    console.log('>>> loaded')
    document.getElementById('addTags').addEventListener('click', function() {
        console.log('>>> click addTags')
        chrome.runtime.sendMessage({ action: 'add_tags' }, (response) => {});
    });

    document.getElementById('clearTags').addEventListener('click', function() {
        console.log('>>> click clearTags')
        chrome.runtime.sendMessage({ action: 'remove_tags' }, (response) => {});
    });
});