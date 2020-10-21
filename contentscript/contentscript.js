let mouseMoved = false;

console.log(CollectorUtils, this, window)

// 先触发mouseup 再click
document.addEventListener('click', function (e) {
    console.log('click')
    if (!mouseMoved) {
        CollectorUtils.disposeFunctionBox();
    }
    mouseMoved = false;
});
document.addEventListener('mouseup', function (e) {
    let selection = document.getSelection();
    console.log('mouse up', selection.toString())
    if (selection.toString()) {
        console.log('about to render:', selection.toString())
        CollectorUtils.geneFunctionBox(e);
    }
}, false);

document.addEventListener('mousedown', function (e) {
    mouseMoved = false;
}, false);
document.addEventListener('mousemove', function (e) {
    mouseMoved = true;
}, false);
document.addEventListener('dblclick', function (e) {
    console.log('double click')
    let selection = document.getSelection();
    if (mouseMoved && selection.toString()) {
        // console.log('about to render:', selection.toString())
        CollectorUtils.geneFunctionBox(e);
    }

}, false);