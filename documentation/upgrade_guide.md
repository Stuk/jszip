---
title: Upgrade Guide
layout: default
section: main
---

### From 2.x to 3.0.0

* Deprecated objects/methods has been removed:
  * `options.base64` in `generate()` (the base64 type is still valid)
  * `options.base64`, `options.binary`, `options.dir`, `options.date`
    on `ZipObject` (see the [2.3 upgrade section](#from-222-to-230))
  * `JSZip.utils`
  * `JSZip.prototype.crc32`, `JSZip.prototype.utf8encode`, `JSZip.prototype.utf8decode`
  * `JSZip.base64` (you can get the content of a file directly as a base64 string)
* `JSZip.compressions` has been removed.
* On `ZipObject`, the synchronous getters has been replaced by `async()` and
  `nodeStream()`.
* The `generate()` method has been replaced by `generateAsync()` and 
  `generateNodeStream()`.
* The `type` option in `generate()` is now mandatory.
* The "text" type has been replaced by the "string" type, a binary string is
  named "binarystring".
* The `load()` method and the constructor with data (`new JSZip(data)`) have
  been replaced by `loadAsync()`.
* When adding a file, the option `createFolders` now defaults to `true`. If
  you don't want to create sub folders, set it to false.
* `zip.generateAsync()` and `zip.generateNodeStream()` now depend on the
  current folder level.

```js
// 2.x
zip.file("test.txt").asText();
// 3.x
zip.file("test.txt").async("string")
.then(function (content) {
    // use content
});


// 2.x
zip.generate();
// 3.x
zip.generateAsync({type:"uint8array"})
.then(function (content) {
    // use content
});

// 2.x
new JSZip(data);
zip.load(data);
// 3.x
JSZip.loadAsync(data);
zip.loadAsync(data);

// 2.x
var data = zip.file("img.jpg").asBinary();
var dataURI = "data:image/jpeg;base64," + JSZip.base64.encode(data);
// 3.x
zip.file("img.jpg").async("base64")
.then(function (data64) {
    var dataURI = "data:image/jpeg;base64," + data64;
});
```

### From 2.2.2 to 2.3.0

* On `ZipObject#options`, the attributes `date` and `dir` have been
  deprecated and are now on `ZipObject`.
* On `ZipObject#options`, the attributes `base64` and `binary` have been
  deprecated.
* `JSZip.base64`, `JSZip.prototype.crc32`, `JSZip.prototype.utf8decode`,
  `JSZip.prototype.utf8encode` and `JSZip.utils` have been deprecated.

```js
// deprecated
zip.file("test.txt").options.date
zip.file("test.txt").options.dir
// new API
zip.file("test.txt").date
zip.file("test.txt").dir
```


### From 2.0.0 to 2.1.0

* The packaging changed : instead of loading jszip.js, jszip-load.js,
  jszip-inflate.js, jszip-deflate.js, just include dist/jszip.js or
  dist/jszip.min.js.
  For AMD loader users : JSZip now registers itself. You just have to put the
  file at the right place or configure your loader.


### From 1.x to 2.x

* `JSZipBase64` has been renamed to `JSZip.base64`.
* The `data` attribute doesn't exist anymore :
  use the getters `asText()`, `asBinary()`, etc
* The compression/decompression methods now give their input type with the
  `compressInputType` and `uncompressInputType` attributes.

Example for the data attribute :

```js
// before
zip.file("test.txt").data;
zip.files["test.txt"].data;
zip.file("image.png").data;
zip.files["image.png"].data;

// after
zip.file("test.txt").asText();
zip.files["test.txt"].asText();
zip.file("image.png").asBinary();
zip.files["image.png"].asBinary();
```
