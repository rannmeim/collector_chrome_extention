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
    _useCache: false,
    ifUseCache() {
        return this._useCache
    },
    setDefault(lines = []) {
        chrome.storage.local.get(LINES, (data) => {
            if (!Array.prototype.isPrototypeOf(data.lines)) {
                chrome.storage.local.set({ [LINES]: lines })
                if (this._useCache) this._notes = lines;
            }
        });    
    },
    init() {
        this._useCache = true;
        return new Promise((resolve, reject) => {
            // !< 非箭头函数时，this指向window >!
            chrome.storage.local.get(LINES, (data) => {
                this._notes = data[LINES] ? data[LINES] : [];
                resolve(this._notes)
            });
        })
    },
    getNotes() {
        return new Promise((resolve, reject) => {
            if (this._useCache) {
                resolve([...this._notes])
            } else {
                chrome.storage.local.get(LINES, (data) => {
                    resolve([...data[LINES]])
                })
            }
        })
    },
    isEmpty() {
        return new Promise((resolve, reject) => {
            if (this._useCache) {
                resolve(!this._notes.length)
            } else {
                chrome.storage.local.get(LINES, (data) => {
                    resolve( !data[LINES] || !data[LINES].length)
                })
            }
        })
    },
    async undoSave() {
        if (!await this.isEmpty()) {
            let notes = await this.getNotes();
            notes.pop();
            chrome.storage.local.set({ [LINES]: notes }, () => {
                if (chrome.runtime.lastError) {
                    throw new Error(chrome.runtime.lastError.message)
                } else {
                    console.log('deleted!')
                    if (this._useCache)
                        this._notes = [...notes];
                }
            })
        }
    },
    parseToMarkdown(type, note) {
        let fixs = text2Md[type];
        if (fixs) {
            return fixs[0] + note + fixs[1]
        } else {
            note = note.split(/\n/).filter(line => line && line.trim());
            switch (type) {
                case 'u-list':
                    return note.map(item => `- ${item.trim()}`).join('\n')
                case 'o-list':
                    return note.map((item, index) => `${index + 1}. ${item.trim()}`).join('\n')
                case 'quote':
                    return '> ' + note.join('\n')
            }
        }
    },
    async save(content) {
        if (!content) {
            content = {type: 'text', text: document.getSelection().toString()}
        }
        let notes = await this.getNotes();
        notes.push(content);
        chrome.storage.local.set({ [LINES]: notes }, () => {
            // !< 无法用try catch 因为是在异步操作中抛出错 >!
            if (chrome.runtime.lastError) { // !< lastError 处理后会自动清除 >!
                throw new Error('空间不够了呢，该清理啦~记得保存之前的笔记哦~')
            } else {
                if (this._useCache)
                    this._notes = [...notes];
            }
        })
    },
    clear() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [LINES]: [] }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    this._notes = [];
                    resolve();
                }
            });
        })
    },
}