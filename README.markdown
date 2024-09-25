JSZip
=====

A library for creating, reading and editing .zip files with JavaScript, with a
lovely and simple API.

See https://stuk.github.io/jszip for all the documentation.

```javascript
const zip = new JSZip();

zip.file("Hello.txt", "Hello World\n");

const img = zip.folder("images");
img.file("smile.gif", imgData, {base64: true});

/* 1. Create a zip file with compressed contents by specifying a compression and compression level (1 is "best speed", 9 is "best compression") */
zip.generateAsync({type:"blob", compression:"DEFLATE", compressionOptions: {level:9}}).then(function(content) {
    // see FileSaver.js
    saveAs(content, "example.zip");
});

/* 2. Or, if you prefer a zip with uncompressed contents, you can omit the compression options */
zip.generateAsync({type:"blob"}).then(function(content) {
    // see FileSaver.js
    saveAs(content, "example.zip");
});

/*
Results in a zip containing
Hello.txt
images/
    smile.gif
*/
```
License
-------

JSZip is dual-licensed. You may use it under the MIT license *or* the GPLv3
license. See [LICENSE.markdown](LICENSE.markdown).
