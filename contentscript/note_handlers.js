const LINES = 'collector-lines';
const text2Md = {
    h1: ['#', ''], // [prefix, suffix]
    h2: ['##', ''],
    h3: ['###', ''],
    h4: ['####', ''],
    h5: ['#####', ''],
    h6: ['######', ''],
    code: ['```\n', '\n```'],
    // quote: ['> ', ''], // quote需要处理多个换行为一个换行
    bold: ['**', '**'],
    italic: ['*', '*'],
    text: ['', ''],
}
const NoteHandlers = {
    _notes: [],
    init() {
        let promise = new Promise(function (resolve, reject) {
            // !< 非箭头函数时，this指向window >!
            chrome.storage.sync.get(LINES, (data) => {
                console.log('init get', data[LINES])
                console.log(this)
                this._notes = data[LINES] ? data[LINES] : [];
                resolve(this._notes)
            });
        }.bind(this))
        return promise
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
    parseToMarkdown(type, note) {
        console.log(note)
        let fixs = text2Md[type];
        if (fixs) {
            return fixs[0] + note + fixs[1]
        } else {
            note = note.split(/\n/).filter(line => line && line.trim());
            console.log(note)
            switch (type) {
                case 'o-list':
                    return note.map(item => `- ${item}`).join('\n')
                case 'u-list':
                    return note.map((item, index) => `${index + 1}. ${item}`).join('\n')
                case 'quote':
                    return '> ' + note.join('\n')
            }
        }
    },
    save(content) {
        // 此时document.getSelection.toString()为空
        this._notes = [...this._notes, content];
        chrome.storage.sync.set({ [LINES]: [...this._notes] }, function () {
            // console.log('save selection')
            // // 同步popup  todo 改为长连接
            // chrome.runtime.sendMessage({ type: 'NOTES_UPDATED' }, function (response) {
            //     console.log(response);
            // });
        })
        SidebarUtils.needUpdate();
    },
    clear() {
        chrome.storage.sync.set({ [LINES]: [] }, () => {
            this._notes = [];
        });
    },
}