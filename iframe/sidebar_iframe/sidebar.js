$('#btn_download').click(() => {
    console.log('download')
    // todo 组织成markdown的形式
    let text = '';
    notes = NoteHandler.getNotes();
    notes.forEach(note => {
        text += NoteHandler.parseToMarkdown(note.type, note.text) + '\n\n'
    })
    console.log('text', text)

    const blob = new Blob([text])

    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a');
    a.setAttribute('download', 'collector_notes.md');
    a.setAttribute('href', blobUrl);
    a.click();
    a.remove();
})
$('#btn_copy').click(() => {
    console.log('copy')
    let textarea = document.createElement('textarea');
    let text = '';
    notes = NoteHandler.getNotes();
    notes.forEach(note => {
        text += NoteHandler.parseToMarkdown(note.type, note.text) + '\n\n'
    })
    console.log('text', text)
    textarea.value = text;
    // textarea.value = '123';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("Copy");
    textarea.remove();
})
$('#btn_clear').click(() => {
    console.log('clear')
    NoteHandler.clear();
    geneList([]);
    // 通知更新popover
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEARED' }, function (response) {
            console.log('CLEARED response', response);
        });
    });
})
function geneList(notes) {
    // let notes = [{
    //     type: 'h1',
    //     text: 'hello'
    // }] // dev
    let list = $('#list');
    list.html('');
    console.log(notes)
    if (!notes.length) {
        let p = $('<p></p>');
        p.addClass('hint');
        p.text('let\'s collect your first note!');
        list.append(p)
    } else {
        notes.forEach(line => {
            // console.log('line', line)
            let li = $('<li></li>');
            li.addClass('list-group-item list__item');
            let div = $('<div></div>')
            div.addClass('list__text')
            div.html(line.text.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;'));
            // !< 加一层imgBox 提前声明尺寸  这样后面获取list-box的height()不会动态改变 >!
            let imgBox = $('<div></div>')
            imgBox.addClass('list__icon__box')
            let img = $('<img/>');
            img.addClass('list__icon')
            img.attr('src', chrome.runtime.getURL(`images/icons/${line.type}.png`));
            imgBox.append(img)
            li.append(imgBox)
            li.append(div)
            list.append(li)
        })
    }
    // 滚动到最下方
    $('#list-box').scrollTop(list.height() - $('#list-box').height())
}
// fixit 其他页面更新notes后 刷新notes

async function init() {
    geneList(await NoteHandler.init());
}
init()