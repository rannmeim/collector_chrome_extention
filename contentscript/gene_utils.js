// utils for 实现细节  contentscript for 业务逻辑
const LINES = 'collector-lines';
const NotesHandlers = {
    _notes: [],
    init() {
        chrome.storage.sync.get(LINES, function (data) {
            if (data[LINES]) {
                this._notes = data[LINES];
            }
        });
    },
    getNotes() {
        return [...this._notes]
    },
    isEmpty() {
        return !this._notes.length
    },
    undoSave() {
        if (!this.isEmpty()) {
            this._notes = this._notes.slice(0, this._notes.length - 1);
        }
        chrome.storage.sync.set({ [LINES]: [...this._notes] }, function () {
            console.log('deleted!')
        })
        ToastUtils.showToast({ type: 'undo' });
    },
    save() {
        selection = document.getSelection().toString().trim();
        this._notes = [...this._notes, selection + '\r\n'];
        chrome.storage.sync.set({ [LINES]: [...this._notes] }, function () {
            console.log('save selection')
            // // 同步popup  todo 改为长连接
            // chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
            //     console.log(response);
            // });
        })
    },
    clear() {
        this._notes = [];
    },
}
const CollectorPopoverUtils = {
    _baseLineRange: null,
    // _notes: [],
    _$toast: null,
    _$popover: null,
    _offset: 10,
    genePopoverBox(mouseupPosition, selection) {
        let range = selection.getRangeAt(selection.rangeCount - 1);
        let startRange = document.createRange();
        let endRange = document.createRange();
        let startRect = null;
        let endRect = null;
        let forward = true;

        this.disposePopoverBox();

        // generate posotion of the first char in the paragraph
        startRange.setStart(range.startContainer, range.startOffset);
        startRange.setEnd(range.startContainer, range.startOffset + 1 > range.startContainer.length ? range.startContainer.length : range.startOffset + 1);
        startRect = startRange.getBoundingClientRect()

        // generate posotion of the last char in the paragraph
        endRange.setStart(range.endContainer, range.endOffset > 0 ? range.endOffset - 1 : 0);
        endRange.setEnd(range.endContainer, range.endOffset);
        endRect = endRange.getBoundingClientRect()

        // culculate direction: forward or not 
        forward = Math.abs((mouseupPosition.x + mouseupPosition.y) - (startRect.x + startRect.y)) > Math.abs((mouseupPosition.x + mouseupPosition.y) - (endRect.right + endRect.top))

        this._baseLineRange = forward ? endRange : startRange;

        // auto save
        this._saveSelection();
        this._genePopover();
        this._setPopoverPosition();
        this._startAdjustPosWhenScroll();
    },
    _genePopover() {
        const btns = ['撤销添加', '搜索']
        const stopedEvents = ['click', 'mouseup']
        let popover = document.createElement('div');
        popover.id = 'collector__popover'
        popover.className = 'collector__popover'
        let content = document.createElement('div');
        content.className = 'collector__popover__content';
        // c-placement: top,bottom
        content.setAttribute('c-placement', 'top')
        btns.forEach(text => {
            let btn = document.createElement('span');
            btn.className = 'collector__popover__btn';

            if (text === '撤销添加') {
                // !< 使用箭头函数 handleAddBtnClick的this指向geneFuncBoxContent >!
                btn.addEventListener('click', () => this._handleUndo())
                // !< 直接放入this.函数 则handleAddBtnClick的this指向该dom元素 >!
            }
            if (text === '搜索') {
                btn.addEventListener('click', () => this._handleSearch())
            }
            btn.innerText = text;
            content.appendChild(btn)
        })
        stopedEvents.forEach(event => {
            content.addEventListener(event, (e) => {
                e.stopPropagation();
            })
        })
        popover.appendChild(content)
        document.body.appendChild(popover)
        this._$popover = $(popover);
    },
    disposePopoverBox() {
        if (this._$popover) {
            this._$popover.remove();
        }
        this._baseLineRange = null;
        this._stopAdjustPosWhenScroll();
    },
    pressAgain() {
        if (!NotesHandlers.isEmpty()) {
        // if (this._notes.length) {
            ToastUtils.showToast({ type: 'again' });
            return { type: 'default' }
        } else {
            ToastUtils.showToast({ type: 'empty' });
            return { type: 'empty' }
        }
    },
    _handleUndo() {
        this.undoSave();
        this.disposePopoverBox();
    },
    _saveSelection() {
        NotesHandlers.save();
        this._highlightSelection();
    },
    _highlightSelection() {
        // todo
        // rangeBox = document.createElement('span');
        // rangeBox.setAttribute('id', 'collector__rangebox');
        // range.surroundContents(rangeBox);
        // console.log(rangeBox)
    },
    _handleSearch(target = 'baidu') {
        if (target === 'baidu') {
            window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(document.getSelection().toString())}`, '_blank');
        };
        this.disposePopoverBox();
    },
    _setPopoverPosition() {
        // todo set placement(top/bottom)
        // !< 每次根据baseLineRange的位置调整, 不用positon: absolute+scrollTop自动适应，因为页面内容位置可能会动态变化 >!
        let area = this._baseLineRange.getBoundingClientRect()
        this._$popover.css({ 'left': `${Math.round(area.left + (area.right - area.left) / 2)}px`, 'top': `${Math.round(area.top - this._offset)}px` })
    },
    _adjustPos: null, // 
    _setAdjustPosFunc() {
        this._adjustPos = ((e) => {
            this._setPopoverPosition()
        }).bind(this) // !< bind(this)会以「创建它时」传入的第一个参数作为this >!
        return this._adjustPos
    },
    _startAdjustPosWhenScroll() {
        this._setAdjustPosFunc();
        document.addEventListener('scroll', this._adjustPos) // !< 如果直接传this._setPostion，函数内部的this会指向document >!
    },
    _stopAdjustPosWhenScroll() {
        document.removeEventListener('scroll', this._adjustPos)
    }
}

const ToastUtils = {
    _texts: { 'again': '再按一次删除最后一条', 'undo': '已删除', 'empty': '还没有笔记，快去添加吧~' },
    _$toast: null, // one toast at a time
    _geneToastEle(id, text) {
        let div = document.createElement('div');
        div.id = id.toString();
        div.className = 'toast toast-body my-toast'
        div.innerText = text
        document.body.appendChild(div)
        return div
    },
    showToast(options) {
        if (this._$toast) {
            this._$toast.toast('hide')
        }
        let id = options.type;
        let toast = this._$toast = $(this._geneToastEle(id, this._texts[id]));
        this._$toast.toast({ delay: 2000 }).toast('show')
        this._$toast.on('hidden.bs.toast', () => {
            toast.remove();
            // reset when no new toast was created (hide is not trigged forcibly)
            if (toast === this._$toast) this._$toast = null;
        })
    }
}

const SidebarUtils = {
    _$siebar: null,
    showSidebar(options) {
    }
}