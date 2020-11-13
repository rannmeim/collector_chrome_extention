// utils for 实现细节  contentscript for 业务逻辑
// Popover 类
function Popover(options) {
    // 没有base元素 则按position fix在屏幕上
    if (options.base) {
        this.base = options.base; // jquery element on which popover base
    } else {
        this.position = options.position; // 箭头指向的位置
    }
    this.popover = null;
    this.offset = Number(options.offset) || 0;
    this.placement = options.placement || 'top'; // placement: top,bottom
    this.content = options.content; // jquery element
    return this
}
Popover.prototype.updatePosition = function (pos) { // 当传入positon时可用
    if (this.position) {
        let position = pos || this.position;
        this.popover.css({ 'position': 'fixed', 'left': position.x + 'px', 'top': position.y + 'px' });
        return this // 便于链式调用
    }
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
    return this
}
Popover.prototype.create = function () {
    if (this.popover) this.popover.remove();

    let popover = $('<div></div>');
    popover.addClass('collector__popover')
    popover.attr('c-placement', this.placement)
    popover.append(this.content)
    this.popover = popover;
    console.log('this.popover', this.popover)

    // handle position
    if (this.base) {
        this.bindToBase();
    } else {
        this.updatePosition();
        $('body').append(this.popover)
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
    _offset: 10,
    _basePopover: null,
    _btns: null,
    _selectionText: '',
    _init() {
        this._btns = [{
            popoverObj: null,
            text: '文字',
            // icon: require(''),
            // onClick: this._handleUndo().bind(this),
            children: [{
                text: "#",
                children: [{
                    text: "1",
                    onClick: () => { console.log('1 clicked') },
                }, {
                    text: "2",
                    onClick: () => { console.log('2 clicked') },
                }]
            }]
        }, {
            text: '搜索',
            // onClick: this._handleSearch().bind(this),
            children: [{
                text: "谷歌",
                onClick: () => this._handleSearch('google'),
            }, {
                text: "百度",
                onClick: () => this._handleSearch('baidu'),
            }, {
                text: "思否",
                onClick: () => this._handleSearch('segmentfault'),
            }, {
                text: "StackOver",
                onClick: () => this._handleSearch('stackover'),
            }]
        }]
    },
    genePopoverBox(mouseupPosition, selection) {
        console.log('gene box')
        this._selectionText = selection.toString().trim();
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


        this._geneAllPopovers();


        // // auto save
        // this._saveSelection();
        this._startAdjustPosWhenScroll();
    },
    _getBasePositon(placement = 'top') {
        // !< 每次根据baseLineRange的位置调整, 不用positon: absolute+scrollTop自动适应，因为页面内容位置可能会动态变化 >!
        let area = this._baseLineRange.getBoundingClientRect();
        let position = {};
        switch (placement) {
            case 'top':
                position.x = Math.round(area.left + (area.right - area.left) / 2);
                position.y = Math.round(area.top);
                break;
            case 'bottom':
                position.x = Math.round(area.left + (area.right - area.left) / 2);
                position.y = Math.round(area.bottom);
                break;
        }
        return position
    },
    _geneAllPopovers() {
        this._init();
        let placement = 'top';
        let content = this._genePopoverContent(this._btns);
        let position = this._getBasePositon(placement);
        this._basePopover = new Popover({
            position,
            offset: this._offset,
            placement,
            content,
        }).create();
    },
    _genePopoverContent(btns) {
        console.log('gene popover content', btns)
        let content = $('<div></div>');
        content.addClass('collector__popover__content')
        btns.forEach(options => {
            console.log('create btn', options)
            let btn = $('<span></span>');
            btn.addClass('collector__popover__btn')
            if (options.onClick) {
                btn.click(options.onClick)
            }
            if (options.text) {
                btn.text(options.text);
            }
            if (options.children) {
                // !< mouseover 事件在鼠标移动到选取的元素及其子元素上时触发 。
                // !< mouseenter 事件只在鼠标移动到选取的元素上时触发。 >!
                btn.mouseenter(() => {
                    console.log('mouseover', btn)
                    if (!options.popoverObj) {
                        let content = this._genePopoverContent(options.children)
                        options.popoverObj = new Popover({
                            base: btn,
                            content,
                            placement: 'top',
                            offset: 0,
                        }).create();
                    } else {
                        options.popoverObj.show();
                    }
                })
                btn.mouseleave(() => {
                    console.log('mouseleave', btn) 
                    if (options.popoverObj) {
                        options.popoverObj.hide();
                    }
                })
            }
            content.append(btn)
        })
        return content
    },
    disposePopoverBox() {
        if (this._basePopover) {
            this._basePopover.destroy();
        }
        this._basePopover = null;
        this._baseLineRange = null;
        this._stopAdjustPosWhenScroll();
    },
    pressAgain() {
        if (!NoteHandlers.isEmpty()) {
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
        console.log('_sel', this._selectionText)
        if (target === 'baidu') {
            window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(this._selectionText)}`, '_blank');
        };
        this.disposePopoverBox();
    },
    _setPopoverPosition() {
        // todo set placement(top/bottom)
        let position = this._getBasePositon('top')
        this._basePopover.updatePosition(position)
    },
    _adjustPos: null, // 
    _setAdjustPosFunc() {
        // !< 箭头函数已经改变了this的指向（由词法作用域确定）不需要再bind(this) >!
        this._adjustPos = () => {
            this._setPopoverPosition()
        }
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