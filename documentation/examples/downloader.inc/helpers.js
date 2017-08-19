/**
 * Reset the message.
 */
function resetMessage () {
    $("#result")
    .removeClass()
    .text("");
}
/**
 * show a successful message.
 * @param {String} text the text to show.
 */
function showMessage(text) {
    resetMessage();
    $("#result")
    .addClass("alert alert-success")
    .text(text);
}
/**
 * show an error message.
 * @param {String} text the text to show.
 */
function showError(text) {
    resetMessage();
    $("#result")
    .addClass("alert alert-danger")
    .text(text);
}
/**
 * Update the progress bar.
 * @param {Integer} percent the current percent
 */
function updatePercent(percent) {
    $("#progress_bar").removeClass("hide")
    .find(".progress-bar")
    .attr("aria-valuenow", percent)
    .css({
        width : percent + "%"
    });
}

if(!JSZip.support.blob) {
    showError("This demo works only with a recent browser !");
    return;
}

