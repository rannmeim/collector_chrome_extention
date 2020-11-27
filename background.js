'use strict';

console.log('This is bg.js！！');
const SWITCH = 'switch'
const menus = {
    'save': 'Save by Collector',
    'switch': 'Turn off Collector',
}
let undoTimeout = null;

chrome.runtime.onInstalled.addListener(function () {
    console.log('oninstalled')

    // init switch
    chrome.storage.local.set({ [SWITCH]: true })

    // init notes
    NoteHandler.setDefault();

    for (let key in menus) {
        chrome.contextMenus.create({
            id: key,
            title: menus[key], // %s表示选中的文字
            // title: `${menus[key]}：%s`, // %s表示选中的文字
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
        switch (params.menuItemId) {
            case 'save':
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'SAVE' }, function (response) {
                        console.log(response);
                    });
                });
                break;
            case 'switch':
                chrome.storage.local.get([SWITCH], data => {
                    chrome.contextMenus.update({
                        id: 'switch',
                        title: data[SWITCH] ? 'Turn on Collector' : 'Turn off Collector', // %s表示选中的文字
                        contexts: ['selection'], // 只有当选中文字时才会出现此右键菜单
                    });
                    chrome.storage.local.set({ [SWITCH]: !data[SWITCH] })
                })
                break;
        }
    });


});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'SHOW_SIDEBAR' }, function (response) {
        console.log(response);
    })
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