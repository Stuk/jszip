---
title: "loadAsync(data [, options])"
layout: default
section: api
---

Read an existing zip and merge the data in the current JSZip
object at the current folder level. This technique has some limitations, see
[here]({{site.baseurl}}/documentation/limitations.html).
If the JSZip object already contains entries, new entries will be merged. If
two have the same name, the loaded one will replace the other.

Since v3.8.0 this method will santize relative path components (i.e. `..`) in loaded filenames to avoid ["zip slip" attacks](https://snyk.io/research/zip-slip-vulnerability). For example: `../../../example.txt` → `example.txt`, `src/images/../example.txt` → `src/example.txt`. The original filename is available on each zip entry as `unsafeOriginalName`.

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) with the updated zip object.
The promise can fail if the loaded data is not valid zip data or if it
uses unsupported features (multi volume, password protected, etc).

__Since__: v3.0.0

## Arguments

name               | type   | description
-------------------|--------|------------
data               | String/Array of bytes/ArrayBuffer/Uint8Array/Buffer/Blob/Promise | the zip file
options            | object | the options to load the zip file

Content of `options` :

name                          | type    | default | description
------------------------------|---------|---------|------------
options.base64                | boolean | false   | set to `true` if the data is base64 encoded, `false` for binary. [More](#base64-option).
options.checkCRC32            | boolean | false   | set to `true` if the read data should be checked against its CRC32. [More](#checkcrc32-option).
options.optimizedBinaryString | boolean | false   | set to `true` if (and only if) the input is a string and has already been prepared with a 0xFF mask.
options.createFolders         | boolean | false   | set to `true` to create folders in the file path automatically. Leaving it false will result in only virtual folders (i.e. folders that merely represent part of the file path) being created. [More](#createfolders-option).
options.decodeFileName        | function | decode from UTF-8 | the function to decode the file name / comment. [More](#decodefilename-option).

You shouldn't update the data given to this method : it is kept as it so any
update will impact the stored data.

Zip features supported by this method :

* Compression (<code>DEFLATE</code> supported)
* zip with data descriptor
* ZIP64
* UTF8 in file name, UTF8 in file content

Zip features not (yet) supported :

* password protected zip
* multi-volume zip

### `base64` option

```js
var zip = new JSZip();
zip.loadAsync("UEsDBAoDAAAAAJxs8T...AAAAAA==", {base64: true});
```

### `checkCRC32` option

The `checkCRC32` option will load every files, compute the CRC32 value and
compare it against the saved value.
With larger zip files, this option can have a significant performance cost.

```js
// here, "bin" is a corrupted zip file

zip.loadAsync(bin)
.then(function (zip) {
    // will be called, even if content is corrupted
}, function (e) {
    // won't be called
});

zip.loadAsync(bin, {
    checkCRC32: true
})
.then(function (zip) {
    // won't be called
}, function (e) {
    // Error: Corrupted zip : CRC32 mismatch
});
```

### `createFolders` option

```js
// here, "bin" is zip file containing:
// folder1/folder2/folder3/file1.txt

zip.loadAsync(bin)
.then(function (zip) {
    console.log(zip.files);
    // folder1/folder2/folder3/file1.txt
});

// with createFolders: true, all folders will be created
zip.loadAsync(bin, {createFolders: true})
.then(function (zip) {
    console.log(zip.files);
    // folder1/
    // folder1/folder2/
    // folder1/folder2/folder3/
    // folder1/folder2/folder3/file1.txt
});
```

### `decodeFileName` option

A zip file has a flag to say if the filename and comment are encoded with UTF-8.
If it's not set, JSZip has **no way** to know the encoding used. It usually
is the default encoding of the operating system. Some extra fields can give
the unicode version of the filename/comment too (in that case, we use it).

If we can't find an UTF-8 encoded filename/comment, we use the `decodeFileName`
function (which is by default an UTF-8 decode).

The function takes the bytes array (Uint8Array or Array) and returns the
decoded string.

```js
// here, "bin" is a russian zip file, using the cp866 encoding for file names
// by default, using UTF-8 leads to wrong file names:
zip.loadAsync(bin)
.then(function (zip) {
    console.log(zip.files);
    // '����� �����/': ...
    // '����� �����/����� ⥪�⮢�� ���㬥��.txt': ...
});

// using the correct encoding solve the issue:
var iconv = require('iconv-lite');
zip.loadAsync(bin, {
  decodeFileName: function (bytes) {
    return iconv.decode(bytes, 'cp866');
  }
})
.then(function (zip) {
    console.log(zip.files);
    // 'Новая папка/': ...
    // 'Новая папка/Новый текстовый документ.txt': ...
});
```

## Other examples

```js
var zip = new JSZip();
zip.loadAsync(zipDataFromXHR);
```

```js
require("fs").readFile("hello.zip", function (err, data) {
  if (err) throw err;
  var zip = new JSZip();
  zip.loadAsync(data);
}
```

Using sub folders :

```js
// here, "bin" is zip file containing:
// file1.txt
// folder1/file2.txt

var zip = new JSZip();
zip.folder("subfolder").loadAsync(bin)
.then(function (zip) {
    // "zip" is still in the "subfolder" folder
    console.log(zip.files);
    // subfolder/file1.txt
    // subfolder/folder1/file2.txt
});
```

Using `loadAsync` multiple times:

```js
// here, "bin1" is zip file containing:
// file1.txt
// file2.txt
// and "bin2" is zip file containing:
// file2.txt
// file3.txt

var zip = new JSZip();
zip.loadAsync(bin1)
.then(function (zip) {
    return zip.loadAsync(bin2);
}).then(function (zip) {
    console.log(zip.files);
    // file1.txt, from bin1
    // file2.txt, from bin2
    // file3.txt, from bin2
});
```

Reading a zip file with relative filenames:

```js
// here, "unsafe.zip" is zip file containing:
// src/images/../file.txt
// ../../example.txt

require("fs").readFile("unsafe.zip", function (err, data) {
    if (err) throw err;
    var zip = new JSZip();
    zip.loadAsync(data)
    .then(function (zip) {
        console.log(zip.files);
        // src/file.txt
        // example.txt
        console.log(zip.files["example.txt"].unsafeOriginalName);
        // "../../example.txt"
    });
}
```
