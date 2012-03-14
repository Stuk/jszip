JSZip
=====

A library for creating, reading and editing .zip files with Javascript, with a
lovely and simple API.

See http://stuartk.com/jszip for all the documentation

```javascript
var zip = new JSZip();

zip.file("Hello.txt", "Hello World\n");

img = zip.folder("images");
img.file("smile.gif", imgData, {base64: true});

var content = zip.generate();

location.href = "data:application/zip;base64," + content;
```