const LINES = 'collector-lines';
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection().toString();
    console.log('mouseup', e, document.getSelection(), selection);
    if (selection) {
        chrome.storage.sync.get(LINES, function (data) {
            console.log('content data:', data);
            console.log('chrome:', chrome);
            chrome.storage.sync.set({ [LINES]: [...data[LINES], selection], check: true }, function () {
                console.log('set selection and send message');
                chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
                    console.log(response);
                    // console.log(response.response);
                });
            })
        });
    }
}, false);
