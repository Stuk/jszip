---
title: "generateAsync(options[, onUpdate])"
layout: default
section: api
---

__Description__ : Generates the complete zip file at the current folder level.

__Arguments__

name                | type     | default  | description
--------------------|----------|----------|------------
options             | object   |          | the options to generate the zip file :
options.compression | string   | `STORE` (no compression) | the default file compression method to use. Available methods are `STORE` and `DEFLATE`. You can also provide your own compression method.
options.compressionOptions | object | `null` | the options to use when compressing the file, see below.
options.type        | string   |          | The type of zip to return, see below for the other types.
options.comment     | string   |          | The comment to use for the zip file.
options.mimeType    | string   | `application/zip` | mime-type for the generated file. Useful when you need to generate a file with a different extension, ie: ".ods".
options.platform    | string   | `DOS`    | The platform to use when generating the zip file.
options.encodeFileName | function | encode with UTF-8 | the function to encode the file name / comment.
options.streamFiles | boolean  | false    | Stream the files and create file descriptors, see below.
onUpdate            | function |          | The optional function called on each internal update with the metadata.

Possible values for `type` :

* `base64` : the result will be a string, the binary in a base64 form.
* `binarystring` (or `string`, deprecated) : the result will be a string in "binary" form, using 1 byte per char (2 bytes).
* `uint8array` : the result will be a Uint8Array containing the zip. This requires a compatible browser.
* `arraybuffer` : the result will be a ArrayBuffer containing the zip. This requires a compatible browser.
* `blob` : the result will be a Blob containing the zip. This requires a compatible browser.
* `nodebuffer` : the result will be a nodejs Buffer containing the zip. This requires nodejs.

Note : when using type = "uint8array", "arraybuffer" or "blob", be sure to
check if the browser supports it (you can use [`JSZip.support`]({{site.baseurl}}/documentation/api_jszip/support.html)).

The `compressionOptions` parameter depends on the compression type. With
`STORE` (no compression), this parameter is ignored. With `DEFLATE`, you can
give the compression level with `compressionOptions : {level:6}` (or any level
between 1 (best speed) and 9 (best compression)).

Note : if the entry is *already* compressed (coming from a compressed zip file),
calling `generateAsync()` with a different compression level won't update the entry.
The reason is simple : JSZip doesn't know how compressed the content was and
how to match the compression level with the implementation we use.

Note for the `comment` option : the zip format has no flag or field to give the
encoding of this field and JSZip will use UTF-8. With non ASCII characters you
might get encoding issues if the file archiver doesn't use UTF-8 to decode the
comment.

Note for the `streamFiles` option : in a zip file, the size and the crc32 of
the content are placed before the actual content : to write it we must process
the whole file. When this option is `false` (the default) the processed file is
held in memory. It takes more memory but generates a zip file which should be
read by every program.
When this options is `true`, we stream the file and use data descriptors at the
end of the entry. This option uses less memory but some program might not
support data descriptors (and won't accept the generated zip file).

If not set, JSZip will use the field `comment` on its `options`.

Possible values for `platform` : `DOS` and `UNIX`. It also accepts nodejs
`process.platform` values.
When using `DOS`, the attribute `dosPermissions` of each file is used.
When using `UNIX`, the attribute `unixPermissions` of each file is used.

If you set the platform value on nodejs, be sure to use `process.platform`.
`fs.stats` returns a non executable mode for folders on windows, if you
force the platform to `UNIX` the generated zip file will have a strange
behavior on UNIX platforms.

__About `encodeFileName`__ :

By default, JSZip uses UTF-8 to encode the file names / comments. You can use
this method to force an other encoding. Note : the encoding used is not stored
in a zip file, not using UTF-8 may lead to encoding issues.
The function takes a string and returns a bytes array (Uint8Array or Array).

__Metadata__ : the metadata are :

name        | type   | description
------------|--------|------------
percent     | number | the percent of completion (a double between 0 and 100)
currentFile | string | the name of the current file being processed, if any.

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
of the generated zip file.

__Throws__ : An exception if the asked `type` is not available in the browser,
see [JSZip.support]({{site.baseurl}}/documentation/api_jszip/support.html).

<!-- __Complexity__ : TODO : worst case, with/out compression, etc -->

__Example__

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

Using a custom charset :


```js
// using iconv-lite for example
var iconv = require('iconv-lite');

zip.generate({
    type: 'uint8array',
    encodeFileName: function (string) {
        return iconv.encode(string, 'your-encoding');
    }
});
```


```js
//This example will Generate a Open Document Spreasheet, with the correct mime type
var zip = new JSZip();
zip.file("mimetype", "application/vnd.oasis.opendocument.spreadsheet");
var conf2 = zip.folder("Configurations2");
conf2.folder("acceleator");
conf2.folder("images");
conf2.folder("popupmenu");
conf2.folder("statusbar");
conf2.folder("floater");
conf2.folder("menubar");
conf2.folder("progressbar");
conf2.folder("toolbar");

var manifest = "<..."; //xml containing manifest.xml
var styles = "<..."; //xml containing styles.xml
var settings = "<..."; //xml containing settings.xml
var meta = "<..."; //xml containing meta.xml
var content = "<..."; //xml containing content.xml

var metaInf = zip.folder("META-INF");
metaInf.file("manifest.xml", manifest);
zip.file("styles.xml", styles);
zip.file("settings.xml", settings);
zip.file("meta.xml", meta);
zip.file("content.xml", content);

//Generate the file
zip.generateAsync({
    type: "blob",
    mimeType: "application/ods",
    compression: "DEFLATE"
}).then(function (odsFile) {
    var url = window.URL.createObjectURL(odsFile);
    var link = document.getElementById("link"); //I suppose you'll have a link with this id :)
    link.download = "testjs.ods";
    link.href = url;
});

```
