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

