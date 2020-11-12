notes = [];
async function fetchNotes() {
    let notes = await NoteHandlers.init();

    let list = document.getElementById('list');
    list.innerHTML = '';

    if (!notes.length) {
        let p = document.createElement('p');
        p.innerText = 'let\'s collect your first note!';
        list.appendChild(p);
    } else {
        notes.forEach(line => {
            let li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerText = line;
            list.appendChild(li);
        })
    }

}

fetchNotes();