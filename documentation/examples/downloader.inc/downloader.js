
var Promise = window.Promise;
if (!Promise) {
    Promise = JSZip.external.Promise;
}

/**
 * Fetch the content and return the associated promise.
 * @param {String} url the url of the content to fetch.
 * @return {Promise} the promise containing the data.
 */
function urlToPromise(url) {
    return new Promise(function(resolve, reject) {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

var $form = $("#download_form").on("submit", function () {

    resetMessage();

    var zip = new JSZip();

    // find every checked item
    $(this).find(":checked").each(function () {
        var $this = $(this);
        var url = $this.data("url");
        var filename = url.replace(/.*\//g, "");
        zip.file(filename, urlToPromise(url), {binary:true});
    });

    // when everything has been downloaded, we can trigger the dl
    zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
        var msg = "progression : " + metadata.percent.toFixed(2) + " %";
        if(metadata.currentFile) {
            msg += ", current file = " + metadata.currentFile;
        }
        showMessage(msg);
        updatePercent(metadata.percent|0);
    })
    .then(function callback(blob) {

        // see FileSaver.js
        saveAs(blob, "example.zip");

        showMessage("done !");
    }, function (e) {
        showError(e);
    });

    return false;
});
