const LINES = 'collector-lines';
let fbox = null;
let rangeBox = null;

function geneFuncBoxContent() {
    const btns = ['添加到笔记', '搜索']
    let content = document.createElement('div');
    btns.forEach(text => {
        let btn = document.createElement('button');
        btn.innerText = text;
        content.appendChild(btn)
    })
    console.log('content', content)
    return content.innerHTML
}

function saveSelection(selection) {
    chrome.storage.sync.get(LINES, function (data) {
        chrome.storage.sync.set({ [LINES]: [...data[LINES], selection] }, function () {
            chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
                console.log(response);
            });
        })
    });
}


function geneBasePoint(position, bgcolor = 'orange') {
    let div = document.createElement('div')
    div.className = 'dot'
    div.style.left = position.x + document.documentElement.scrollLeft + 'px';
    div.style.top = position.y + document.documentElement.scrollTop + 'px';
    div.style.background = bgcolor;
    // div.style.opacity = 0;
    div.setAttribute('id', 'collector__funcbox__base');
    console.log('div', div)
    document.getElementsByTagName('body')[0].appendChild(div)
    return div
}


function geneFunctionBox(mouseupPosition, selection) {
    let range = selection.getRangeAt(selection.rangeCount - 1);
    let startChar = document.createRange();
    let endChar = document.createRange();
    let startRect = null;
    let endRect = null;
    let forward = true;
    let position = null;

    // generate posotion of the first char in the paragraph
    startChar.setStart(range.startContainer, range.startOffset);
    startChar.setEnd(range.startContainer, range.startOffset + 1);
    startRect = startChar.getBoundingClientRect()

    // generate posotion of the last char in the paragraph
    endChar.setStart(range.endContainer, range.endOffset - 1);
    endChar.setEnd(range.endContainer, range.endOffset);
    endRect = endChar.getBoundingClientRect()

    // console.log(range)
    // console.log('startPos', startRect.x, startRect.y)
    // console.log('endPos', endRect.right, endRect.top)
    // console.log('mouseupPos', mouseupPosition.x, mouseupPosition.y)

    forward = Math.abs((mouseupPosition.x + mouseupPosition.y) - (startRect.x + startRect.y)) > Math.abs((mouseupPosition.x + mouseupPosition.y) - (endRect.right + endRect.top))
    position = forward ? { x: endRect.right, y: endRect.top } : { x: startRect.x, y: startRect.y }

    // release range
    range.detach()
    startChar.detach()
    endChar.detach()

    // generate popover
    // let popover = tippy(geneBasePoint(position), {
    //     showOnCreate: true,
    //     trigger: 'manual',
    //     theme: 'tomato',
    //     placement: 'top',
    //     content: geneFuncBoxContent(),
    //     allowHTML: true,
    //     zIndex: 2147483647,
    // });
    // console.log(popover)

    console.log($("#collector__funcbox__base"))
    $("#collector__funcbox__base").popover({
        container: 'body',
        content: 'hi~~~~',
        // html: true,
        // content: geneFuncBoxContent(),
        placement: 'top',
        // trigger: 'manual',
    })
    // $("#collector__funcbox__base").popover('show');



    // saveSelection(selection.toString());

    // rangeBox = document.createElement('span');
    // rangeBox.setAttribute('id', 'collector__rangebox');
    // range.surroundContents(rangeBox);
    // console.log(rangeBox)


    // todo destory
    // popover.unmount();
    // range.detach()
    // startChar.detach()
    // endChar.detach()
}

document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    console.log('mouseup', e, selection, 'tostring:', selection.toString());
    if (selection.toString()) {
        geneFunctionBox(e, selection);
    }
}, false);

function delFunctionBox() {
    console.log('del fbox!')

}

document.addEventListener('click', function (e) {
    // console.log('client x,y:', e.clientX, e.clientY)
    //     e.stopPropagation();
    // delFunctionBox();
}, false);