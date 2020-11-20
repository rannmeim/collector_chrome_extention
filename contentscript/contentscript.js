let mouseMoved = false;

document.addEventListener('click', function (e) {
    console.log('page click')
    if (!mouseMoved) {
        PopoverHandler.disposePopoverBox();
    }
    SidebarHandler.hideSidebar();
    mouseMoved = false;
});
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    if (selection.toString().trim()) {
        PopoverHandler.genePopoverBox(e, selection);
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
        PopoverHandler.genePopoverBox(e, selection);
    }

}, false);


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // console.log(sender.tab ?
    //   "from a content script:" + sender.tab.url :
    //     "from the extension");
    switch (request.type) {
        case 'PRESS_AGAIN':
            ToastHandler.showToast({ type: 'again' });
            sendResponse({ response: "got it" });
            break;
        case 'EMPTY':
            ToastHandler.showToast({ type: 'empty' });
            sendResponse({ response: "got it" });
            break;
        case 'UNDO':
            ToastHandler.showToast({ type: 'undo' });
            sendResponse({ response: "got it" });
            break;
        case 'CLEARED':
            ToastHandler.showToast({ type: 'cleared' });
            sendResponse({ response: "got it" });
            break;
        case 'SHOW_SIDEBAR':
            SidebarHandler.toggleSidebar();
            sendResponse({ response: "got it" });
            break;
        default:
            sendResponse({response: 'undefined action'})
    }
});