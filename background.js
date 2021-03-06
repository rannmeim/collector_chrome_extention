'use strict';

console.log('This is bg.js！！');

const LINES = 'collector-lines';
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
    chrome.storage.sync.get(LINES, function (data) {
        if (!Array.prototype.isPrototypeOf(data.lines)) {
            chrome.storage.sync.set({ [LINES]: [] })
        }
    });

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

    chrome.commands.onCommand.addListener(function (command) {
        if (command === 'undo_last_one') {
            // 防抖
            if (undoTimeout) {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'UNDO' }, function (response) {
                        console.log(response);
                    });
                });
                clearTimeout(undoTimeout);
                undoTimeout = null;
            } else {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'PRESS_AGAIN_TO_UNDO' }, function (response) {
                        console.log('PRESS_AGAIN_TO_UNDO response', response);
                        if (response.type !== 'empty') {
                            // !< setTimeout是Task >!
                            undoTimeout = setTimeout(() => {
                                if (undoTimeout) {
                                    undoTimeout = null;
                                }
                            }, 1000)
                        }
                    });
                });
            }
        }
    });

});