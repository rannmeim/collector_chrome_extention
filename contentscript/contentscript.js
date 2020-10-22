let mouseMoved = false;

document.addEventListener('click', function (e) {
    console.log('page click')
    if (!mouseMoved) {
        CollectorPopoverUtils.disposePopoverBox();
    }
    mouseMoved = false;
});
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    // console.log('mouse up', selection.toString())
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
    // console.log('double click')
    let selection = document.getSelection();
    if (mouseMoved && selection.toString()) {
        CollectorPopoverUtils.genePopoverBox(e, selection);
    }

}, false);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('contentscript onmessage!')
    console.log(sender)
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
        "from the extension");
    console.log('request:', request)
    sendResponse({ response: "got it" });
  });