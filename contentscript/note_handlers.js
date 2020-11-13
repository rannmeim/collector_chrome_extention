const LINES = 'collector-lines';
const NoteHandlers = {
    _notes: [],
    init() {
        let promise = new Promise(function (resolve, reject) {
            chrome.storage.sync.get(LINES, function (data) {
                if (data[LINES]) {
                    this._notes = data[LINES];
                }
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
    save(content) {
        // 此时document.getSelection.toString()为空
        console.log('content', content)
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
        this._notes = [];
    },
}