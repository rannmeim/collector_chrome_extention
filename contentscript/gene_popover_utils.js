// utils for 实现细节  contentscript for 业务逻辑
const LINES = 'collector-lines';
const CollectorPopoverUtils = {
    _baseLineRange: null,
    // _placement: '', // top-left  top-right
    _popoverFrame: null,
    _offset: 2,
    genePopoverBox: function (mouseupPosition, selection) {
        let range = selection.getRangeAt(selection.rangeCount - 1);
        let startRange = document.createRange();
        let endRange = document.createRange();
        let startRect = null;
        let endRect = null;
        let forward = true;
        let position = null;
        let height = 0;

        this.disposePopoverBox();

        // generate posotion of the first char in the paragraph
        startRange.setStart(range.startContainer, range.startOffset);
        startRange.setEnd(range.startContainer, range.startOffset + 1);
        startRect = startRange.getBoundingClientRect()

        // generate posotion of the last char in the paragraph
        endRange.setStart(range.endContainer, range.endOffset - 1);
        endRange.setEnd(range.endContainer, range.endOffset);
        endRect = endRange.getBoundingClientRect()
        forward = Math.abs((mouseupPosition.x + mouseupPosition.y) - (startRect.x + startRect.y)) > Math.abs((mouseupPosition.x + mouseupPosition.y) - (endRect.right + endRect.top))
        position = forward ? { x: endRect.right, y: endRect.top } : { x: startRect.x, y: startRect.y }
        // this._placement = forward ? 'top-right' : 'top-left';
        this._baseLineRange = forward ? endRange : startRange;
        height = Math.abs(endRect.bottom - startRect.y);

        // gene funbox iframe
        let iframe = document.createElement('iframe')
        iframe.src = chrome.runtime.getURL("iframe/popover_iframe/popover_iframe.html")
        iframe.id = 'collector-popover-iframe'
        iframe.setAttribute('scrolling', 'no')
        iframe.setAttribute('frameborder', '0')
        this._popoverFrame = iframe
        this._setPosition(position)
        document.body.appendChild(iframe)

        this._startAdjustPosWhenScroll();

        // 监听iframe.js关闭popover的信号
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
            if (request.signal === 'CLOSE_POPOVER') {
                this.disposePopoverBox();
                sendResponse({ response: "popover closed" });
            }
            if (request.signal === 'SAVE') {
                this._saveSelection();
                sendResponse({ response: "selection highlighted" });
            }
        });

        return
    },
    disposePopoverBox: function () {
        this._stopAdjustPosWhenScroll();
        if (this._popoverFrame) {
            this._popoverFrame.remove();
        }
        this._baseLineRange = null;
        this._popoverFrame = null;
    },
    _saveSelection() {
        selection = document.getSelection().toString();
        chrome.storage.sync.get(LINES, function (data) {
            chrome.storage.sync.set({ [LINES]: [...data[LINES], selection + '\r\n'] }, function () {
                // // 同步popup  todo 改为长连接
                // chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
                //     console.log(response);
                // });
            })
        });
        this._highlightSelection();
        this.disposePopoverBox();
    },
    _highlightSelection() {
        // todo
        // rangeBox = document.createElement('span');
        // rangeBox.setAttribute('id', 'collector__rangebox');
        // range.surroundContents(rangeBox);
        // console.log(rangeBox)
    },
    _setPosition(position) {
        this._popoverFrame.style.cssText = `height:58px;width:166px;z-index:2147483647;position:fixed;left:${Math.round(position.x)}px;top:${Math.round(position.y)}px;transform:translate(-50%, calc(-100% - ${this._offset || 0}px));`
    },
    _adjustPos: null,
    _setAdjustPosFunc() {
        this._adjustPos = ((e) => {
            this._setPosition(this._baseLineRange.getBoundingClientRect())
        }).bind(this)
        return this._adjustPos
    },
    _startAdjustPosWhenScroll() {
        this._setAdjustPosFunc();
        document.addEventListener('scroll', this._adjustPos)
    },
    _stopAdjustPosWhenScroll() {
        document.removeEventListener('scroll', this._adjustPos)
    }
}