let mouseMoved = false;

NoteHandlers.init();

document.addEventListener('click', function (e) {
    console.log('page click')
    if (!mouseMoved) {
        PopoverUtils.disposePopoverBox();
    }
    SidebarUtils.hideSidebar();
    mouseMoved = false;
});
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    if (selection.toString().trim()) {
        PopoverUtils.genePopoverBox(e, selection);
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
    if (mouseMoved && selection.toString().trim()) {
        PopoverUtils.genePopoverBox(e, selection);
    }

}, false);


chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
        "from the extension");
    switch (request.type) {
        case 'PRESS_AGAIN_TO_UNDO':
            let data = PopoverUtils.pressAgain()
            sendResponse({ type: data.type });
            break;
        case 'UNDO':
            NoteHandlers.undoSave();
            sendResponse({ response: "got it" });
            break;
        case 'CLEARED':
            NoteHandlers.init();
            ToastUtils.showToast({ type: 'cleared' });
            sendResponse({ response: "got it" });
            break;
        case 'SHOW_SIDEBAR':
            SidebarUtils.toggleSidebar();
            sendResponse({ response: "got it" });
            break;
        default:
            sendResponse({response: 'undefined action'})
    }
});