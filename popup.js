// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

console.log('chrome', chrome);

const LINES = 'collector-lines';

let list = document.getElementById('list__box');

document.getElementById('dl_btn').addEventListener('click', function (e) {
  console.log('download!')
  // todo  p中的text 或storage中的字段  组织成markdown的形式
  const blob = new Blob(['123123123'])
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a');
  a.setAttribute('download', 'notes.txt');
  a.setAttribute('href', blobUrl);
  a.click();
})
document.getElementById('clear_btn').addEventListener('click', function (e) {
  console.log('clear!')
  chrome.storage.sync.set({ [LINES]: [] }, function () {
    console.log('clear done')
    list.innerHTML = '';
  });
})

function fetchNotes() {
  console.log('fetch notes')
  // 获取Storage中的note
  chrome.storage.sync.get(LINES, function (data) {
    list.innerHTML = '';

    console.log('notes:', data[LINES])

    data[LINES].forEach(line => {
      let p = document.createElement('p');
      p.innerText = line;
      list.appendChild(p);
    })
  });

}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");
  if (request.type === 'NOTES_UPDATED')
    fetchNotes();
  sendResponse({ response: "got it" });
});

fetchNotes();