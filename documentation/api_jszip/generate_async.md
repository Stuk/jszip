---
title: "generateAsync(options[, onUpdate])"
layout: default
section: api
---

Generates the complete zip file at the current folder level.

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
of the generated zip file.

An error will be propagated if the asked `type` is not available in the
browser, see [JSZip.support]({{site.baseurl}}/documentation/api_jszip/support.html).

__Since__: v3.0.0

## Arguments

name                | type     | default  | description
--------------------|----------|----------|------------
options             | object   |          | the options to generate the zip file :
options.type        | string   |          | The type of zip to return, see below for the other types. **Required**. [More](#type-option).
options.compression | string   | `STORE` (no compression) | the default file compression method to use. [More](#compression-and-compressionoptions-options).
options.compressionOptions | object | `null` | the options to use when compressing the file. [More](#compression-and-compressionoptions-options).
options.comment     | string   |          | The comment to use for the zip file. [More](#comment-option).
options.mimeType    | string   | `application/zip` | mime-type for the generated file. [More](#mimetype-option).
options.platform    | string   | `DOS`    | The platform to use when generating the zip file. [More](#platform-option).
options.encodeFileName | function | encode with UTF-8 | the function to encode the file name / comment. [More](#encodefilename-option).
options.streamFiles | boolean  | false    | Stream the files and create file descriptors, see below. [More](#streamfiles-option).
onUpdate            | function |          | The optional function called on each internal update with the metadata. [More](#onupdate-callback).

### `type` option

Possible values for `type` :

* `base64`: the result will be a string, the binary in a base64 form.
* `binarystring` (or `string`, deprecated): the result will be a string in "binary" form, using 1 byte per char (2 bytes).
* `array`: the result will be an Array of bytes (numbers between 0 and 255) containing the zip.
* `uint8array`: the result will be a Uint8Array containing the zip. This requires a compatible browser.
* `arraybuffer`: the result will be a ArrayBuffer containing the zip. This requires a compatible browser.
* `blob`: the result will be a Blob containing the zip. This requires a compatible browser.
* `nodebuffer`: the result will be a nodejs Buffer containing the zip. This requires nodejs.

Note : when using type = "uint8array", "arraybuffer" or "blob", be sure to
check if the browser supports it (you can use [`JSZip.support`]({{site.baseurl}}/documentation/api_jszip/support.html)).

```js
zip.generateAsync({type: "uint8array"}).then(function (u8) {
    // ...
});
```

### `compression` and `compressionOptions` options

Available `compression` methods are `STORE` (no compression) and `DEFLATE`.

The `compressionOptions` parameter depends on the compression type. With
`STORE` (no compression), this parameter is ignored. With `DEFLATE`, you can
give the compression level with `compressionOptions : {level:6}` (or any level
between 1 (best speed) and 9 (best compression)).

Note : if the entry is *already* compressed (coming from a compressed zip file),
calling `generateAsync()` with a different compression level won't update the entry.
The reason is simple : JSZip doesn't know how compressed the content was and
how to match the compression level with the implementation we use.

```js
zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    }
});
```

### `comment` option

The zip format has no flag or field to give the encoding of this field and
JSZip will use UTF-8. With non ASCII characters you might get encoding issues
if the file archiver doesn't use UTF-8 (or the given encoding) to decode the
comment.

```js
zip.generateAsync({
    type: "blob",
    comment: "The comment text for this zip file"
})
```

### `mimeType` option

This field is used when you generate a Blob and need to change
[the mime type](https://developer.mozilla.org/en-US/docs/Web/API/Blob/type).
Useful when you need to generate a file with a different extension, ie: ".ods".

Note, this won't change the content of the file, only the other programs *may*
see it.

```js
//This example will Generate a Open Document Spreadsheet, with the correct mime type
var zip = new JSZip();
zip.file("mimetype", "application/vnd.oasis.opendocument.spreadsheet");
var metaInf = zip.folder("META-INF");
metaInf.file("manifest.xml", "<...");
// ...

//Generate the file
zip.generateAsync({
    type: "blob",
    mimeType: "application/ods",
    compression: "DEFLATE"
}).then(function (odsFile) {
    // odsFile.type == "application/ods"
});
```

### `platform` option

Possible values for `platform` : `DOS` and `UNIX`. It also accepts nodejs
`process.platform` values.
When using `DOS`, the attribute `dosPermissions` of each file is used.
When using `UNIX`, the attribute `unixPermissions` of each file is used.

If you set the platform value on nodejs, be sure to use `process.platform`.
`fs.stats` returns a non executable mode for folders on windows, if you
force the platform to `UNIX` the generated zip file will have a strange
behavior on UNIX platforms.

```js
// on nodejs
zip.file(pathname, content, {
    date: stat.mtime,
    unixPermissions: stat.mode
});

// ...

zip.generateAsync({
    type: 'nodebuffer',
    platform: process.platform
});
```

### `encodeFileName` option

By default, JSZip uses UTF-8 to encode the file names / comments. You can use
this method to force an other encoding. Note: the encoding used is not stored
in a zip file, not using UTF-8 may lead to encoding issues.
The function takes a string and returns a bytes array (Uint8Array or Array).

See also [`decodeFileName` on `JSZip#loadAsync()`]({{site.baseurl}}/documentation/api_jszip/load_async.html#decodefilename-option).

```js
// using iconv-lite for example
var iconv = require('iconv-lite');

zip.generateAsync({
    type: 'uint8array',
    encodeFileName: function (string) {
        return iconv.encode(string, 'your-encoding');
    }
});
```


### `streamFiles` option

In a zip file, the size and the crc32 of the content are placed before the
actual content: to write it we must process the whole file. When this option
is `false` (the default) the processed file is held in memory. It takes more
memory but generates a zip file which should be read by every program.
When this options is `true`, we stream the file and use data descriptors at the
end of the entry. This option uses less memory but some program might not
support data descriptors (and won't accept the generated zip file).

```js
zip.generateAsync({
    type: 'uint8array',
    streamFiles: true
});
```

### `onUpdate` callback

If specified, this function will be called each time a chunk is pushed to the
output stream (or internally accumulated).

The function takes a `metadata` object which contains information about the
ongoing process.

__Metadata__ : the metadata are:

name        | type   | description
------------|--------|------------
percent     | number | the percent of completion (a double between 0 and 100)
currentFile | string | the name of the current file being processed, if any.

```js
zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
    console.log("progression: " + metadata.percent.toFixed(2) + " %");
    if(metadata.currentFile) {
        console.log("current file = " + metadata.currentFile);
    }
})
```

## Other examples

```js
zip.generateAsync({type:"blob"})
.then(function (content) {
    // see FileSaver.js
    saveAs(content, "hello.zip");
});
```

```js
zip.generateAsync({type:"base64"})
.then(function (content) {
    location.href="data:application/zip;base64,"+content;
});
```

```js
zip.folder("folder_1").folder("folder_2").file("hello.txt", "hello");
// zip now contains:
// folder_1/
// folder_1/folder_2/
// folder_1/folder_2/hello.txt

zip.folder("folder_1").generateAsync({type:"nodebuffer"})
.then(function (content) {
    // relative to folder_1/, this file only contains:
    // folder_2/
    // folder_2/hello.txt
    require("fs").writeFile("hello.zip", content, function(err){/*...*/});
});
```
