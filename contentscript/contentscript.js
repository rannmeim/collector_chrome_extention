let mouseMoved = false;

CollectorPopoverUtils.init();

document.addEventListener('click', function (e) {
    console.log('page click')
    if (!mouseMoved) {
        CollectorPopoverUtils.disposePopoverBox();
    }
    mouseMoved = false;
});
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    if (selection.toString()) {
        CollectorPopoverUtils.genePopoverBox(e, selection);
    }
}, false);

document.addEventListener('mousedown', function (e) {
    mouseMoved = false;
}, false);
document.addEventListener('mousemove', function (e) {
    mouseMoved = true;
}, false);
document.addEventListener('dblclick', function (e) {
    let selection = document.getSelection();
    if (mouseMoved && selection.toString()) {
        CollectorPopoverUtils.genePopoverBox(e, selection);
    }

}, false);


chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");
    if (request.type === 'PRESS_AGAIN_TO_UNDO') {
        let data = CollectorPopoverUtils.pressAgain()
        sendResponse({ type: data.type });
    }
    if (request.type === 'UNDO') {
        CollectorPopoverUtils.undoSave();
        sendResponse({ response: "got it" });
    }
    if (request.type === 'CLEAR') {
        CollectorPopoverUtils.clear();
        sendResponse({ response: "got it" });
    }
});