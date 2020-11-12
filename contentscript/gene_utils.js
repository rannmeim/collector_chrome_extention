// utils for 实现细节  contentscript for 业务逻辑
// Popover 类
function Popover(options) {
    // 没有base元素 则按position fix在屏幕上
    if (this.base) {
        this.base = options.base; // jquery element on which popover base
    } else {
        this.position = options.position;
    }
    this.popover = null;
    this.offset = Number(options.offset) || 0;
    this.placement = options.placement || 'top'; // placement: top,bottom
    this.content = options.content;
    return this // 便于链式调用
}
Popover.prototype.updatePosition = function (pos) {
    let position = pos || this.position;
    this.popover.css({ 'position': 'fixed', 'left': position.x + 'px', 'top': position.y + 'px' });
}
Popover.prototype.bindToBase = function () {
    this.base.css('position', 'relative');
    this.popover.css({ 'position': 'absolute', 'left': '50%' });
    switch (this.placement) {
        case 'top':
            this.popover.css({ 'top': `-${this.offset}px` });
            break;
        case 'bottom':
            this.popover.css({ 'bottom': `-${this.offset}px` });
            break;
    }
    this.base.append(this.popover);
}
Popover.prototype.create = function () {
    if (this.popover) this.popover.remove();
    let popover = document.createElement('div');
    popover.className = 'collector__popover collector__popover--hidden'
    popover.setAttribute('c-placement', this.placement)
    popover.appendChild(content)
    this.popover = $(popover);

    // handle position
    if (this.base) {
        this.bindToBase();
    } else {
        this.updatePosition();
        $('body')[0].append(popover)
    }

    return this;
}
Popover.prototype.show = function () {
    this.popover.removeClass('collector__popover--hidden');
    return this;
}
Popover.prototype.hide = function () {
    this.popover.addClass('collector__popover--hidden');
    return this;
}
Popover.prototype.destroy = function () {
    this.popover.remove();
    this.popover = null;
    return this;
}

// 单例模式
const PopoverUtils = {
    _baseLineRange: null,
    _$toast: null,
    _$popover: null,
    _offset: 10,
    _btns: [{
        text: '文字',
        onClick: this._handleUndo().bind(this),
        children: [

        ]
    }, {
        text: '搜索',
        onClick: this._handleSearch().bind(this),
        children: [

        ]
    }],
    genePopoverBox(mouseupPosition, selection) {
        console.log('gene box')
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
    _genePopoverContent() {
        let content = document.createElement('div');
        content.className = 'collector__popover__content';
        this.btns.forEach(item => {
            let btn = document.createElement('span');
            btn.className = 'collector__popover__btn';
            btn.addEventListener('click', item.onClick)
            btn.innerText = item.text;
            content.appendChild(btn)
        })
        return $(content)
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
        if (!NoteHandlers.isEmpty()) {
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
        NoteHandlers.save();
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
            window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(document.getSelection().toString().trim())}`, '_blank');
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
    _$sidebar: null,
    _shown: false,
    _needUpdate: false,
    needUpdate() {
        this._needUpdate = true;
    },
    _showSidebar() {
        if (this._needUpdate) {
            console.log('recreate sidebar')
            this._destroySidebar();
        }
        if (!this._$sidebar) {
            let iframe = document.createElement('iframe')
            iframe.src = chrome.runtime.getURL("iframe/sidebar_iframe/sidebar.html")
            iframe.id = 'collector__sidebar'
            iframe.className = 'collector__sidebar'
            iframe.setAttribute('scrolling', 'no')
            iframe.setAttribute('frameborder', '0')
            document.body.appendChild(iframe)
            this._$sidebar = $(iframe)
        }
        this._$sidebar.removeClass('collector__sidebar--hidden')
        this._shown = true;
    },
    hideSidebar() {
        if (this._$sidebar) {
            this._$sidebar.addClass('collector__sidebar--hidden')
        }
        this._shown = false;
    },
    _destroySidebar() {
        if (this._$sidebar) {
            this._$sidebar.remove();
        }
        this._needUpdate = false;
        this._shown = false;
        this._$sidebar = null;
    },
    toggleSidebar() {
        this._shown ? this.hideSidebar() : this._showSidebar();
    },
}