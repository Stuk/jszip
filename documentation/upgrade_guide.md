---
title: Upgrade Guide
layout: default
section: main
---

### From 2.0.0 to 2.1.0

* The packaging changed : instead of loading jszip.js, jszip-load.js,
  jszip-inflate.js, jszip-deflate.js, just include dist/jszip.js or
  dist/jszip.min.js.


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
