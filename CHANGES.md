### v2.1.1, 2012-02-13
 - use the npm package for zlib.js instead of the github url.

### v2.1.0, 2013-02-06
 - split the files and use Browserify to generate the final file (see [#74](https://github.com/Stuk/jszip/pull/74))
 - packaging change : instead of 4 files (jszip.js, jszip-load.js, jszip-inflate.js, jszip-deflate.js) we now have 2 files : dist/jszip.js and dist/jszip.min.js
 - add component/bower support
 - rename variable: 'byte' is a reserved word (see [#76](https://github.com/Stuk/jszip/pull/76))
 - add support for the unicode path extra field (see [#82](https://github.com/Stuk/jszip/pull/82))
 - ensure that the generated files have a header with the licenses (see [#80](https://github.com/Stuk/jszip/pull/80))

# v2.0.0, 2013-10-20

 - `JSZipBase64` has been renamed to `JSZip.base64`.
 - The `data` attribute on the object returned by `zip.file(name)` has been removed. Use `asText()`, `asBinary()`, `asUint8Array()`, `asArrayBuffer()` or `asNodeBuffer()`.

 - [Fix issue with Android browser](https://github.com/Stuk/jszip/pull/60)

 - The compression/decompression methods now give their input type with the `compressInputType` and `uncompressInputType` attributes.
 - Lazily decompress data when needed and [improve performance in general](https://github.com/Stuk/jszip/pull/56)
 - [Add support for `Buffer` in Node.js](https://github.com/Stuk/jszip/pull/57).
 - Package for CommonJS/npm.

### v1.0.1, 2013-03-04

 - Fixed an issue when generating a compressed zip file with empty files or folders, see #33.
 - With bad data (null or undefined), asText/asBinary/asUint8Array/asArrayBuffer methods now return an empty string, see #36.

# v1.0.0, 2013-02-14

- First release after a long period without version.

