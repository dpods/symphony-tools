document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('callFunctions').addEventListener('click', function() {
        chrome.runtime.sendMessage({action: "tag_symphony"}, (response) => {});
    });
});