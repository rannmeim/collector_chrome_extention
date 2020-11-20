'use strict';

console.log('This is bg.js！！');

const menus = {
    // 'google': '谷歌搜索',
    'baidu': '百度搜索',
    // 'segmentsefault': '思否搜索',
    // 'google_tran': '谷歌翻译'
}
let undoTimeout = null;

chrome.runtime.onInstalled.addListener(function () {
    console.log('oninstalled')
    // init storage
    NoteHandler.setDefault();

    for (let key in menus) {
        chrome.contextMenus.create({
            id: key,
            title: `${menus[key]}：%s`, // %s表示选中的文字
            contexts: ['selection'], // 只有当选中文字时才会出现此右键菜单
        });
    }

    // todo  根据storage中存储的设置参数渲染开启或关闭
    // chrome.contextMenus.create({
    //     id: 'switch',
    //     title: '关闭 or 开启 Collector',
    //     contexts: ['all'],
    // });
    chrome.contextMenus.onClicked.addListener(function (params) {
        console.log('params:', params, params.menuItemId)
        chrome.tabs.create({ url: 'https://www.baidu.com/s?ie=utf-8&wd=' + encodeURI(params.selectionText) });
    });


});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_SIDEBAR' }, function (response) {
            console.log(response);
        });
    });
});

chrome.commands.onCommand.addListener(async function (command) {
    if (command === 'undo_last_one') {
        // 防抖
        let type = '';
        if (undoTimeout) {
            // 删除最后一条
            console.log('call undo')
            NoteHandler.undoSave();
            // 让当前Active tab显示Toast
            type = 'UNDO';
            console.log('clear timeout')
            clearTimeout(undoTimeout);
            undoTimeout = null;
        } else {
            if (!await NoteHandler.isEmpty()) {
                type = 'PRESS_AGAIN';
                // !< setTimeout是Task >!
                undoTimeout = setTimeout(() => {
                    if (undoTimeout) {
                        undoTimeout = null;
                    }
                }, 1000)
            } else {
                type = 'EMPTY';
            }
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { type }, function (response) {
                console.log(response);
            });
        });
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // console.log(sender.tab ?
    //   "from a content script:" + sender.tab.url :
    //     "from the extension");
    if (request) {
        switch (request.type) {
            case 'UPDATE':
                NoteHandler.init();
                sendResponse({ response: "bg got it" });
                break;
            default:
                sendResponse({ response: 'undefined action' })
        }
    }
})