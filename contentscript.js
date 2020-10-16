const LINES = 'collector-lines';
let fbox = null;
let rangeBox = null;

function saveSelection(selection) {
    chrome.storage.sync.get(LINES, function (data) {
        chrome.storage.sync.set({ [LINES]: [...data[LINES], selection] }, function () {
            chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
                console.log(response);
            });
        })
    });
}
function geneFunctionBox(position, selection) {

    saveSelection(selection.toString());
}


function delFunctionBox() {
    console.log('del fbox!')

}
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    console.log('mouseup', e, selection);
    if (selection) {
        let range = selection.getRangeAt(selection.rangeCount - 1);
        console.log('rec', range.getBoundingClientRect())
        console.log('0 range:', range)
        // rangeBox = document.createElement('span');
        // rangeBox.setAttribute('id', 'collector__rangebox');
        // range.surroundContents(rangeBox);
        // console.log(rangeBox)
        
        // geneFunctionBox({ x: e.offsetX, y: e.offsetY }, selection);
    }
}, false);

document.addEventListener('click', function (e) {
    console.log('client x,y:', e.clientX, e.clientY)
    //     e.stopPropagation();
    // delFunctionBox();
}, false);