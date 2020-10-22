let $base = null;
function geneBasePoint() {
    let div = document.createElement('div')
    div.className = 'dot'
    div.id = 'collector__funcbox__base';
    document.body.appendChild(div)
    return div
}
function hidePopover() {
    if ($base) {
        $base.popover('hide');
        $base.remove();
    }
    // sendMessage to close popover box
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { signal: "CLOSE_POPOVER" }, function (response) {
            console.log('response:', response)
        });
    });
}
function genePopover() {

    // generate popover by tippy
    // let popover = tippy(geneBasePoint(), {
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
    geneBasePoint();
    $base = $("#collector__funcbox__base")
    $base.popover({
        container: 'body',
        html: true,
        content: geneFuncBoxContent(),
        placement: 'top',
        trigger: 'manual',
        // offset: 10,
    })
    $base.popover('show');
}

function search(target = 'baidu') {
    // console.log('handle search click', this)
    if (target === 'baidu') {
        window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(document.getSelection().toString())}`, '_blank');
    };
    hidePopover();
}

function handleAddBtnClick() {
    saveSelection();
}

// function highlightSelection() {
function saveSelection() {
    // send save message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { signal: "SAVE" }, function (response) {
            // console.log('popover contentscript get response!')
            console.log('response:', response)
        });
    });

}

function geneFuncBoxContent() {

    const btns = ['添加到笔记', '搜索']
    const stopedEvents = ['click', 'mouseup']
    let content = document.createElement('div');
    content.className = 'c__funcbox__content';
    btns.forEach(text => {
        let btn = document.createElement('button');
        btn.setAttribute('type', 'btn');
        btn.className = 'btn btn-outline-warning btn-sm popover__btn';

        if (text === '添加到笔记') {
            // 使用箭头函数 handleAddBtnClick的this指向geneFuncBoxContent
            btn.addEventListener('click', () => handleAddBtnClick())
            // 直接放入函数 则handleAddBtnClick的this指向该dom元素
            // btn.addEventListener('click', handleAddBtnClick)
        }
        if (text === '搜索') {
            btn.addEventListener('click', () => search())
        }
        btn.innerText = text;
        content.appendChild(btn)
    })
    // stopedEvents.forEach(event => {
    //     content.addEventListener(event, (e) => {
    //         e.stopPropagation();
    //     })
    // })
    return content
}


document.addEventListener('click', function (e) {
    console.log('iframe click')
});

genePopover();