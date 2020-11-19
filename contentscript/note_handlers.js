const LINES = 'collector-lines';
const text2Md = {
    h1: ['# ', ''], // [prefix, suffix]
    h2: ['## ', ''],
    h3: ['### ', ''],
    h4: ['#### ', ''],
    h5: ['##### ', ''],
    h6: ['###### ', ''],
    code: ['```\n', '\n```'],
    // quote: ['> ', ''], // quote需要处理多个换行为一个换行
    bold: ['**', '**'],
    italic: ['*', '*'],
    text: ['', ''],
}

const NoteHandler = {
    _notes: [],
    init() {
        return new Promise((resolve, reject) => {
            // !< 非箭头函数时，this指向window >!
            chrome.storage.local.get(LINES, (data) => {
                this._notes = data[LINES] ? data[LINES] : [];
                resolve(this._notes)
            });
        })
    },
    getNotes() {
        return [...this._notes]
    },
    isEmpty() {
        return !this._notes.length
    },
    undoSave() {
        return new Promise((resolve, reject) => {
            let notes = [];
            if (!this.isEmpty()) {
                notes = this._notes.slice(0, this._notes.length - 1);
            }
            chrome.storage.local.set({ [LINES]: notes }, function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    console.log('deleted!')
                    this._notes = [...notes];
                    resolve();
                }
            })
        })
    },
    parseToMarkdown(type, note) {
        // console.log(note)
        let fixs = text2Md[type];
        if (fixs) {
            return fixs[0] + note + fixs[1]
        } else {
            note = note.split(/\n/).filter(line => line && line.trim());
            // console.log(note)
            switch (type) {
                case 'u-list':
                    return note.map(item => `- ${item}`).join('\n')
                case 'o-list':
                    return note.map((item, index) => `${index + 1}. ${item}`).join('\n')
                case 'quote':
                    return '> ' + note.join('\n')
            }
        }
    },
    save(content) {
        return new Promise((resolve, reject) => {
            // 此时document.getSelection.toString()为空
            let notes = [];
            notes = [...this._notes, content];
            chrome.storage.local.set({ [LINES]: notes }, () => {
                // !< 无法用try catch 因为是在异步操作中抛出错 >!
                if (chrome.runtime.lastError) { // !< lastError 处理后会自动清除 >!
                    console.log(chrome.runtime.lastError.message)
                    reject('空间不够了呢~清理一下嘛~记得保存之前的笔记哦~');
                } else {
                    this._notes = [...notes];
                    resolve();
                }
            })
        })
    },
    clear() {
        chrome.storage.local.set({ [LINES]: [] }, () => {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message)
                reject(chrome.runtime.lastError.message);
            } else {
                this._notes = [];
                resolve();
            }
        });
    },
}