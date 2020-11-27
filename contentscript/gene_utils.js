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
    if (options.id) {
        this.id = options.id;
    }
    return this
}
Popover.prototype.updatePosition = function (pos) { // 当传入positon时可用
    if (this.position) {
        let position = pos || this.position;
        this.popover.css({ 'position': 'fixed', 'left': position.x + 'px', 'top': position.y + (this.placement === 'top' ? -this.offset : this.offset) + 'px' });
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
            this.popover.css({ 'bottom': `-${this.offset}px`, 'transform': 'translate(-50%, 100%)' });
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
    if (this.id) {
        popover.attr('id', this.id)
    }
    this.popover = popover;

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
const PopoverHandler = {
    _baseLineRange: null,
    _offset: 10,
    _basePopover: null,
    _selectionText: '',
    _placement: 'top',
    _init() {
        let btns = [{
            popoverObj: null, // 该btn负责的Popover对象（每个可生成popover的btn都会生成一个popoverObj
            text: 'Md',
            title: 'Markdown',
            icon: chrome.runtime.getURL('images/icons/note.png'),
            children: [{
                text: "text",
                title: 'Plain text', // html attribute: title
                icon: chrome.runtime.getURL('images/icons/text.png'),
                onClick: () => { this._saveSelection('text') },
            }, {
                text: "h",
                title: 'Heading',
                icon: chrome.runtime.getURL('images/icons/h.png'),
                children: [{
                    text: "1",
                    title: 'Level 1 heading',
                    icon: chrome.runtime.getURL('images/icons/h1.png'),
                    onClick: () => { this._saveSelection('h1') },
                }, {
                    text: "2",
                    title: 'Level 2 heading',
                    icon: chrome.runtime.getURL('images/icons/h2.png'),
                    onClick: () => { this._saveSelection('h2') },
                }, {
                    text: "3",
                    title: 'Level 3 heading',
                    icon: chrome.runtime.getURL('images/icons/h3.png'),
                    onClick: () => { this._saveSelection('h3') },
                }, {
                    text: "4",
                    title: 'Level 4 heading',
                    icon: chrome.runtime.getURL('images/icons/h4.png'),
                    onClick: () => { this._saveSelection('h4') },
                }, {
                    text: "5",
                    title: 'Level 5 heading',
                    icon: chrome.runtime.getURL('images/icons/h5.png'),
                    onClick: () => { this._saveSelection('h5') },
                }, {
                    text: "6",
                    title: 'Level 6 heading',
                    icon: chrome.runtime.getURL('images/icons/h6.png'),
                    onClick: () => { this._saveSelection('h6') },
                }]
            }, {
                text: "</>",
                title: 'Code',
                icon: chrome.runtime.getURL('images/icons/code.png'),
                onClick: () => { this._saveSelection('code') },
            }, {
                text: "“”",
                title: 'Quote',
                icon: chrome.runtime.getURL('images/icons/quote.png'),
                onClick: () => { this._saveSelection('quote') },
            }, {
                text: "o-list",
                title: 'Ordered list',
                icon: chrome.runtime.getURL('images/icons/o-list.png'),
                onClick: () => { this._saveSelection('o-list') },
            }, {
                text: "u-list",
                title: 'Unordered list',
                icon: chrome.runtime.getURL('images/icons/u-list.png'),
                onClick: () => { this._saveSelection('u-list') },
            }, {
                text: "B",
                title: 'Bold',
                icon: chrome.runtime.getURL('images/icons/bold.png'),
                onClick: () => { this._saveSelection('bold') },
            }, {
                text: "I",
                title: 'Italic',
                icon: chrome.runtime.getURL('images/icons/italic.png'),
                onClick: () => { this._saveSelection('italic') },
            }]
        }, {
            text: '搜索',
            title: 'Search',
            icon: chrome.runtime.getURL('images/icons/search.png'),
            children: [{
                text: "谷歌",
                title: 'Google',
                icon: chrome.runtime.getURL('images/icons/google.png'),
                onClick: () => this._handleSearch('google'),
            }, {
                text: "百度",
                title: 'Baidu',
                icon: chrome.runtime.getURL('images/icons/baidu.png'),
                onClick: () => this._handleSearch('baidu'),
            }, {
                text: "StackOverflow",
                title: 'Stack Overflow',
                icon: chrome.runtime.getURL('images/icons/stackoverflow.png'),
                onClick: () => this._handleSearch('stackoverflow'),
            }]
        }, {
            text: "谷歌翻译",
            title: 'Google translate',
            icon: chrome.runtime.getURL('images/icons/googletranslate.png'),
            onClick: () => this._translate(this._selectionText),
        }]
        let basePopover = {
            children: btns,
            popoverObj: null,
        }
        !function geneParent(popoverOption) {
            if (popoverOption.children) {
                popoverOption.children.forEach(item => {
                    item._parent = popoverOption;
                    geneParent(item);
                })
            }
        }(basePopover)

        this._basePopover = basePopover;
    },
    genePopoverBox(mouseupPosition, selection) {
        // console.log('gene box')
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
        forward = Math.abs((mouseupPosition.x + mouseupPosition.y) - (startRect.x + startRect.y)) > Math.abs((mouseupPosition.x + mouseupPosition.y) - (endRect.right + endRect.bottom))
        this._placement = forward ? 'bottom' : 'top';
        this._baseLineRange = forward ? endRange : startRange;

        this._geneAllPopovers();

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
        let content = this._genePopoverContent(this._basePopover.children);
        let position = this._getBasePositon(this._placement);
        this._basePopover.popoverObj = new Popover({
            position,
            offset: this._offset,
            placement: this._placement,
            content,
            id: 'collector__popover--root'
        }).create();
    },
    _genePopoverContent(btns) {
        const stopedEvents = ['click', 'mouseup']
        let content = $('<div></div>');
        content.addClass('collector__popover__content')
        btns.forEach(options => {
            let btn = $('<div></div>');
            btn.addClass('collector__popover__btn')
            if (options.onClick) {
                btn.click(options.onClick)
            }
            if (options.title) {
                btn.attr('title', options.title)
            }
            if (options.icon) {
                let img = $('<img/>');
                img.addClass('collector__popover__icon')
                img.attr('src', options.icon);
                btn.append(img)
            } else {
                btn.text(options.text);
            }
            if (options.children) {
                // !< mouseover 事件在鼠标移动到选取的元素及其子元素上时触发 。
                // !< mouseenter 事件只在鼠标移动到选取的元素上时触发。 >!
                btn.mouseenter(() => {
                    // 隐藏其他同级popover
                    options._parent.children.forEach(childOption => {
                        if (childOption.popoverObj) childOption.popoverObj.hide();
                    })
                    if (!options.popoverObj) {
                        let content = this._genePopoverContent(options.children)
                        options.popoverObj = new Popover({
                            base: btn,
                            content,
                            placement: this._placement,
                            offset: 0,
                        }).create();
                    } else {
                        options.popoverObj.show();
                    }
                })
            }

            stopedEvents.forEach(event => {
                content[event](e => {
                    e.stopPropagation();
                })
            })
            content.append(btn)
        })
        return content
    },
    disposePopoverBox() {
        if (this._basePopover && this._basePopover.popoverObj) {
            this._basePopover.popoverObj.destroy();
        }
        this._basePopover = null;
        this._baseLineRange = null;
        this._stopAdjustPosWhenScroll();
    },
    _saveSelection(type) {
        NoteHandler.save({ text: this._selectionText, type })
            .then(() => {
                SidebarHandler.needUpdate();
                this._highlightSelection();
                this.disposePopoverBox();
                chrome.runtime.sendMessage({ type: 'UPDATE' }, function (response) {
                    console.log(response);
                });
            }).catch(err => {
                ToastHandler.showToast({ type: 'error', text: err.message });
                this.disposePopoverBox();
            });
    },
    _highlightSelection() {
        // todo
        // rangeBox = document.createElement('span');
        // rangeBox.setAttribute('id', 'collector__rangebox');
        // range.surroundContents(rangeBox);
        // console.log(rangeBox)
    },
    _handleSearch(target = 'baidu') {
        switch (target) {
            case 'baidu':
                window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(this._selectionText)}`, '_blank');
                break;
            case 'google':
                window.open(`https://www.google.com/search?q=${encodeURI(this._selectionText)}&ie=UTF-8`, '_blank');
                break;
            case 'stackoverflow':
                window.open(`https://stackoverflow.com/search?q=${encodeURI(this._selectionText)}`, '_blank');
                break;
        }
        this.disposePopoverBox();
    },
    _getGoogleTranslateContent(options) {
        let giframe = $('<iframe></iframe>')
        let {tl, sl, text} = options
        let url = `https://translate.google.cn/#view=home&op=translate&tl=${tl}&sl=${sl}&text=${encodeURI(text)}`
        giframe.attr('src', url)
        giframe.attr('id', 'collector__googletranslate__iframe')
        $('body').append(giframe)
        // giframe.css('display', 'none')
        document.getElementsByClassName
        let trans = giframe[0].contentWindow.document.getElementsByClassName('translation')[0]
        console.log(trans)
        console.log(trans.innerText)
    },
    _translate(text) {
        let tl = 'zh-CN';
        let sl = 'en'
        if (/[\u4E00-\u9FFF]/.test(text)) {
            tl = 'en';
            sl = 'zh-CN'
        }
        // this._getGoogleTranslateContent({text, tl, sl})
        window.open(`https://translate.google.cn/#view=home&op=translate&tl=${tl}&sl=${sl}&text=${encodeURI(text)}`, '_blank');
    },
    _setPopoverPosition() {
        // todo set placement(top/bottom)
        let position = this._getBasePositon('top')
        this._basePopover.popoverObj.updatePosition(position)
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

const ToastHandler = {
    _texts: { 'again': '再按一次删除最后一条', 'undo': '已删除', 'empty': '还没有笔记，快去添加吧~', 'cleared': '列表已清空', 'error': '出错啦' },
    _$toast: null, // one toast at a time
    _geneToastEle(id, text) {
        let div = document.createElement('div');
        div.id = `collector__toast--${id}`;
        div.className = 'toast toast-body collector__toast'
        div.innerText = text
        document.body.appendChild(div)
        return div
    },
    showToast(options) {
        if (this._$toast) {
            this._$toast.toast('hide')
        }
        console.log('show tooast', options)
        let id = options.type;
        let toast = this._$toast = $(this._geneToastEle(id, options.text || this._texts[id]));
        this._$toast.toast({ delay: 2000 }).toast('show')
        this._$toast.on('hidden.bs.toast', () => {
            toast.remove();
            // reset when no new toast was created (hide is not trigged forcibly)
            if (toast === this._$toast) this._$toast = null;
        })
    }
}

const SidebarHandler = {
    _$sidebar: null,
    _shown: false,
    _needUpdate: false,
    needUpdate() {
        this._needUpdate = true;
    },
    _showSidebar() {
        if (this._needUpdate && this._$sidebar) {
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
    // todo add refresh func
    hideSidebar() {
        this._destroySidebar();
        // if (this._$sidebar) {
        //     this._$sidebar.addClass('collector__sidebar--hidden')
        // }
        // this._shown = false;
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