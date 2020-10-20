const LINES = 'collector-lines';
// let rangeBox = null; // 高亮框
let $base = null;
let mouseMoved = false;

function geneFuncBoxContent() {
    const btns = ['添加到笔记', '搜索']
    let content = document.createElement('div');
    content.style.padding = '6px 0px'
    btns.forEach(text => {
        let btn = document.createElement('button');
        btn.setAttribute('type', 'btn');
        btn.className = 'btn btn-outline-warning btn-sm popover__btn';

        if (text === '添加到笔记') {
            btn.addEventListener('click', handleAddBtnClick)
        }
        if (text === '搜索') {
            btn.addEventListener('click', () => search())
        }
        btn.innerText = text;
        content.appendChild(btn)
    })
    content.addEventListener('click', (e) => {
        e.stopPropagation();
    })
    return content
}

function search(target = 'baidu') {
    if (target === 'baidu') {
        window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(document.getSelection().toString())}`,'_blank');
    };
    disposeFunctionBox();
}

function saveSelection() {
    selection = document.getSelection().toString();
    chrome.storage.sync.get(LINES, function (data) {
        chrome.storage.sync.set({ [LINES]: [...data[LINES], selection + '\r\n'] }, function () {
            // // 同步popup  todo 改为长连接
            // chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
            //     console.log(response);
            // });
        })
    });
    disposeFunctionBox();
}

function geneBaseLine(position, height) {
    let div = document.createElement('div')
    div.className = 'dot'
    div.style.left = position.x + document.documentElement.scrollLeft + 'px';
    div.style.top = position.y + document.documentElement.scrollTop + 'px';
    div.style.height = height + 'px';
    div.style.opacity = 0;
    div.setAttribute('id', 'collector__funcbox__base');
    document.getElementsByTagName('body')[0].appendChild(div)
    return div
}


function geneFunctionBox(mouseupPosition, selection) {
    disposeFunctionBox();

    let range = selection.getRangeAt(selection.rangeCount - 1);
    let startChar = document.createRange();
    let endChar = document.createRange();
    let startRect = null;
    let endRect = null;
    let forward = true;
    let position = null;
    let height = 0;

    // generate posotion of the first char in the paragraph
    startChar.setStart(range.startContainer, range.startOffset);
    startChar.setEnd(range.startContainer, range.startOffset + 1);
    startRect = startChar.getBoundingClientRect()

    // generate posotion of the last char in the paragraph
    endChar.setStart(range.endContainer, range.endOffset - 1);
    endChar.setEnd(range.endContainer, range.endOffset);
    endRect = endChar.getBoundingClientRect()
    forward = Math.abs((mouseupPosition.x + mouseupPosition.y) - (startRect.x + startRect.y)) > Math.abs((mouseupPosition.x + mouseupPosition.y) - (endRect.right + endRect.top))
    position = forward ? { x: endRect.right, y: endRect.top } : { x: startRect.x, y: startRect.y }
    height = Math.abs(endRect.bottom - startRect.y);

    // release range
    range.detach()
    startChar.detach()
    endChar.detach()

    // generate popover by tippy
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
    // todo destory
    // popover.unmount();

    //generate popover by bootstrap
    geneBaseLine(position, height);
    $base = $("#collector__funcbox__base")
    $base.popover({
        // container: 'body',
        html: true,
        content: geneFuncBoxContent(),
        placement: 'top',
        trigger: 'manual',
        offset: 10,
    })
    $base.popover('show');
}

function disposeFunctionBox() {
    if ($base) {
        $base.popover('dispose');
        $base.remove();
        $base = null;
    }
}

function highlightSelection() {
    console.log('hightlight', document.getSelection().toString())

    // rangeBox = document.createElement('span');
    // rangeBox.setAttribute('id', 'collector__rangebox');
    // range.surroundContents(rangeBox);
    // console.log(rangeBox)
}

function handleAddBtnClick() {
    saveSelection();
    highlightSelection();
}

document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    if (mouseMoved && selection.toString()) {
        geneFunctionBox(e, selection);
    }
}, false);

document.addEventListener('click', function (e) {
    if (!mouseMoved) {
        disposeFunctionBox();
    }
    mouseMoved = false;
});

document.addEventListener('mousedown', function (e) {
    mouseMoved = false;
}, false);
document.addEventListener('mousemove', function (e) {
    mouseMoved = true;
}, false);