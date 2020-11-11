// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const LINES = 'collector-lines';

let notes = [];

document.getElementById('dl_btn').addEventListener('click', function (e) {
  // console.log('download!', 'notes', notes)
  // todo 组织成markdown的形式
  const blob = new Blob(notes)

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a');
  a.setAttribute('download', 'notes.txt');
  a.setAttribute('href', blobUrl);
  a.click();
})
document.getElementById('clear_btn').addEventListener('click', function (e) {
  chrome.storage.sync.set({ [LINES]: [] }, function () {
    fetchNotes();
  });
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR' }, function (response) {
          console.log('CLEAR response', response);
      });
  });
})
document.getElementById('copy_btn').addEventListener('click', function (e) {
  let textarea = document.createElement('textarea');
  textarea.value = notes.join('');
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("Copy");
  textarea.remove();

})

function fetchNotes() {
  chrome.storage.sync.get(LINES, function (data) {
    let list = document.getElementById('list');
    let btnBoxmain = document.getElementById('btn__box');
    notes = data[LINES];
    list.innerHTML = '';

    if (!data[LINES].length) {
      let p = document.createElement('p');
      p.innerText = 'let\'s collect your first note!';
      list.appendChild(p);
      btnBoxmain.style.display = 'none';
    } else {
      btnBoxmain.style.display = 'block';
      data[LINES].forEach(line => {
        let li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerText = line;
        list.appendChild(li);
      })
    }
  });

}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('popup js onmessage!')
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");
  if (request.type === 'NOTES_UPDATED')
    fetchNotes();
  sendResponse({ response: "got it" });
});

fetchNotes();