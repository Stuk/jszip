var zip = new JSZip();
zip.file("Hello.txt", "Hello world\n");

jQuery("#data_uri").on("click", function () {
    zip.generateAsync({type:"base64"}).then(function (base64) {
        window.location = "data:application/zip;base64," + base64;
    }, function (err) {
        jQuery("#data_uri").text(err);
    });
});
