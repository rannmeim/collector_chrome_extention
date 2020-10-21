// utils for 实现细节  contentscript for 业务逻辑
const LINES = 'collector-lines';
const CollectorUtils = {
    $base: null,
    geneFunctionBox: function (mouseupPosition) {
        let selection = document.getSelection();
        this.disposeFunctionBox();

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
        //     content: this._geneFuncBoxContent(),
        //     allowHTML: true,
        //     zIndex: 2147483647,
        // });
        // console.log(popover)
        // todo destory
        // popover.unmount();

        //generate popover by bootstrap
        this._geneBaseLine(position, height);
        this.$base = $("#collector__funcbox__base")
        this.$base.popover({
            // container: 'body',
            html: true,
            content: this._geneFuncBoxContent(),
            // content: CollectorUtils._geneFuncBoxContent(),
            placement: 'top',
            trigger: 'manual',
            offset: 10,
        })
        this.$base.popover('show');
    },
    _geneBaseLine: function (position, height) {
        let div = document.createElement('div')
        div.className = 'dot'
        div.style.left = position.x + document.documentElement.scrollLeft + 'px';
        div.style.top = position.y + document.documentElement.scrollTop + 'px';
        div.style.height = height + 'px';
        div.setAttribute('id', 'collector__funcbox__base');
        document.getElementsByTagName('body')[0].appendChild(div)
        return div
    },
    disposeFunctionBox: function () {
        if (this.$base) {
            this.$base.popover('hide');
            this.$base.remove();
            this.$base = null;
        }
    },
    _saveSelection: function () {
        selection = document.getSelection().toString();
        chrome.storage.sync.get(LINES, function (data) {
            chrome.storage.sync.set({ [LINES]: [...data[LINES], selection + '\r\n'] }, function () {
                // // 同步popup  todo 改为长连接
                // chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
                //     console.log(response);
                // });
            })
        });
        this.disposeFunctionBox();
    },
    _geneFuncBoxContent: function () {
        const btns = ['添加到笔记', '搜索']
        const stopedEvents = ['click', 'mouseup']
        let content = document.createElement('div');
        content.className = 'c__funcbox__content';
        btns.forEach(text => {
            let btn = document.createElement('button');
            btn.setAttribute('type', 'btn');
            btn.className = 'btn btn-outline-warning btn-sm popover__btn';
    
            if (text === '添加到笔记') {
                // 使用箭头函数 _handleAddBtnClick的this指向_geneFuncBoxContent
                btn.addEventListener('click', () => this._handleAddBtnClick())
                // 直接放入函数 则_handleAddBtnClick的this指向该dom元素
                // btn.addEventListener('click', this._handleAddBtnClick)
            }
            if (text === '搜索') {
                btn.addEventListener('click', () => this._search())
            }
            btn.innerText = text;
            content.appendChild(btn)
        })
        stopedEvents.forEach(event => {
            content.addEventListener(event, (e) => {
                e.stopPropagation();
            })
        })
        return content
    },
    _handleAddBtnClick: function () {
        this._saveSelection();
        this._highlightSelection();
    },
    // todo
    _highlightSelection: function () {
        console.log('hightlight', document.getSelection().toString())
    
        // rangeBox = document.createElement('span');
        // rangeBox.setAttribute('id', 'collector__rangebox');
        // range.surroundContents(rangeBox);
        // console.log(rangeBox)
    },
    _search: function (target = 'baidu') {
        // console.log('handle search click', this)
        if (target === 'baidu') {
            window.open(`https://www.baidu.com/s?ie=utf-8&wd=${encodeURI(document.getSelection().toString())}`,'_blank');
        };
        this.disposeFunctionBox();
    }
}