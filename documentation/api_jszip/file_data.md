---
title: "file(name, data [,options])"
layout: default
section: api
---

Add (or update) a file to the zip file.
If something goes wrong (the data is not in a supported format for example),
an exception will be propagated when accessing the data.

__Returns__ : The current JSZip object, for chaining.

__Since__: v1.0.0

## Arguments

name                | type    | description
--------------------|---------|------------
name                | string  | the name of the file. You can specify folders in the name : the folder separator is a forward slash ("/").
data                | String/ArrayBuffer/Uint8Array/Buffer/Blob/Promise/Nodejs stream | the content of the file.
options             | object  | the options.

Content of `options` :

name        | type    | default | description
------------|---------|---------|------------
base64      | boolean | `false` | set to `true` if the data is base64 encoded. For example image data from a `<canvas>` element. Plain text and HTML do not need this option. [More](#base64-option).
binary      | boolean | `false` | set to `true` if the data should be treated as raw content, `false` if this is a text. If base64 is used, this defaults to `true`, if the data is not a string, this will be set to `true`. [More](#binary-option).
date        | date    | the current date | the last modification date. [More](#date-option).
compression | string  | null    | If set, specifies compression method to use for this specific file. If not, the default file compression will be used, see [generateAsync(options)]({{site.baseurl}}/documentation/api_jszip/generate_async.html). [More](#compression-and-compressionoptions-options).
compressionOptions | object | `null` | the options to use when compressing the file, see [generateAsync(options)]({{site.baseurl}}/documentation/api_jszip/generate_async.html). [More](#compression-and-compressionoptions-options).
comment     | string  | null    | The comment for this file. [More](#comment-option).
optimizedBinaryString | boolean | `false` | Set to true if (and only if) the input is a "binary string" and has already been prepared with a 0xFF mask.
createFolders | boolean | `true` | Set to true if folders in the file path should be automatically created, otherwise there will only be virtual folders that represent the path to the file. [More](#createfolders-option).
unixPermissions | 16 bits number | null    | The UNIX permissions of the file, if any. [More](#unixpermissions-and-dospermissions-options).
dosPermissions  | 6 bits number  | null    | The DOS permissions of the file, if any. [More](#unixpermissions-and-dospermissions-options).
dir             | boolean        | false   | Set to true if this is a directory and content should be ignored. [More](#dir-option).

### data input

You shouldn't update the data given to this method: it is kept as it so any
update will impact the stored data.

#### About Promise <small>since v3.0.0</small>

You can use a Promise of content directly to simplify async content handling.
Let's use HTTP calls as examples:

```js
/** with promises **/

// instead of
$.get("url/to.file.txt") // jQuery v3 returns promises
.then(function (content) {
    zip.file("file.txt", content);
})

// you can do
var promise = $.get("url/to.file.txt");
zip.file("file.txt", promise);
```

```js
/** with callbacks **/

// instead of
request('url/to.file.txt', function (error, response, body) {
    zip.file("file.txt", body);
});

// you can do
var promise = new Promise(function (resolve, reject) {
    request('url/to.file.txt', function (error, response, body) {
        if (error) {
            reject(error);
        } else {
          resolve(body);
        }
    });
});
zip.file("file.txt", promise);
```

#### About Blob <small>since v3.0.0</small>

You can use directly [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
as input, no need to use a `FileReader`.
[File](https://developer.mozilla.org/en-US/docs/Web/API/File) objects are Blobs
so you can use them directly:

```js
// in a change callback of a <input type="file">
var files = evt.target.files;
for (var i = 0; i < files.length; i++) {
    var f = files[i];
    zip.file(f.name, f);
}
```

#### About nodejs stream <small>since v3.0.0</small>

A stream can't be restarted: if it is used once, it can't be used again (
by [generateAsync()]({{site.baseurl}}/documentation/api_jszip/generate_async.html)
or by [ZipObject methods]({{site.baseurl}}/documentation/api_zipobject.html)).
In that case, the promise/stream (depending on the method called) will get
an error.


### `base64` option

```js
var zip = new JSZip();
zip.file("hello.txt", "aGVsbG8gd29ybGQK", {base64: true});
```

### `binary` option

```js
var zip = new JSZip();

// here, we have a correct (unicode) string
zip.file("hello.txt", "unicode ♥", {binary: false});

// here, we have a binary string: it can contain binary content, one byte
// per character.
zip.file("hello.txt", "unicode \xE2\x99\xA5", {binary: true});
```

If you use a library that returns a binary string for example, you should use
this option. Otherwise, you will get a corrupted result: JSZip will try to
encode this string with UTF-8 when the content doesn't need to.

### `date` option

```js
zip.file("Xmas.txt", "Ho ho ho !", {
    date: new Date("December 25, 2007 00:00:01")
});
```

### `compression` and `compressionOptions` options

See also the same options on [`JSZip#generateAsync()`]({{site.baseurl}}/documentation/api_jszip/generate_async.html#compression-and-compressionoptions-options).

These options will be used when generating a zip file. They let you override
entry per entry the compression / compression options to use.

```js
zip.file("a.png", contentOfA, {
    compression: "STORE" // force a compression for this file
});
zip.file("b.txt", contentOfA, {
    compression: "DEFLATE",
    compressionOptions: {
        level: 9 // force a compression and a compression level for this file
    }
});

// don't force anything, use the generateAsync options
zip.file("c.txt", contentOfB);

// here:
// - a.png will not be compressed (STORE)
// - b.txt will be compressed at maximum level
// - c.txt will be compressed with the default compression level
zip.generateAsync({
    type: "blob",
    compression: "DEFLATE"
});
```

### `comment` option

```js
zip.file("a.txt", "content", {
    comment: "comment of a.txt"
});
```

### `createFolders` option

```js
zip.file("a/b/c/d.txt", "content", {
    createFolders: true // default value
});
console.log(zip.files);
// will display:
// - a/
// - a/b/
// - a/b/c/
// - a/b/c/d.txt


zip.file("a/b/c/d.txt", "content", {
    createFolders: false
});
console.log(zip.files);
// will display:
// - a/b/c/d.txt
```

### `unixPermissions` and `dosPermissions` options

Each permission will be used for matching [platform option of generateAsync()]({{site.baseurl}}/documentation/api_jszip/generate_async.html):
on `DOS`, use `dosPermissions`, on `UNIX`, use `unixPermissions`.

On nodejs you can use the `mode` attribute of
[nodejs' fs.Stats](http://nodejs.org/api/fs.html#fs_class_fs_stats).

When not set, a default value will be generated:

- `0100664` or `040775` for `UNIX`
- standard file or standard directory for `DOS`

The field `unixPermissions` also accepts a **string** representing the
octal value: "644", "755", etc.

```js
zip.file("script.sh", "#!/bin/bash", {
    unixPermissions: "755"
});
```


### `dir` option

If `dir` is true or if a permission says it's a folder, this entry be flagged
as a folder and the content will be ignored.

See also [folder(name)]({{site.baseurl}}/documentation/api_jszip/folder_name.html).

```js
zip.file("folder/", null, {
    dir: true
});
```

## Other examples

```js
zip.file("Hello.txt", "Hello World\n");

// base64
zip.file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
// from an ajax call with xhr.responseType = 'arraybuffer'
zip.file("smile.gif", arraybufferFromXhr);
// or on nodejs
zip.file("smile.gif", fs.readFileSync("smile.gif"));

zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
zip.file("folder/file.txt", "file in folder");

zip.file("animals.txt", "dog,platypus\n").file("people.txt", "james,sebastian\n");

// result:
// - Hello.txt
// - smile.gif
// - Xmas.txt
// - animals.txt
// - people.txt
// - folder/
// - folder/file.txt
```
