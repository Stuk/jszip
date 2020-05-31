---
title: "Frequently Asked Questions"
layout: default
section: main
---

### "Corrupted zip or bug: unexpected signature"

If you are sure that the zip file is correct, that error often comes from a
corrupted content. An ajax request, if not prepared correctly, will try to
decode the binary content as a text and corrupt it. See
[this page]({{site.baseurl}}/documentation/howto/read_zip.html).

### My browser crashes / becomes unresponsive / never finish the execution

That happens if you try to handle to much data with the synchronous API. If
possible, try the asynchronous API, see
[this page]({{site.baseurl}}/documentation/limitations.html) for more information.

### Can't read the data of [...]. Is it in a supported JavaScript type ?

Or the old message:

> The data of [...] is in an unsupported format

The method [`file(name, data [,options])`]({{site.baseurl}}/documentation/api_jszip/file_data.html)
accepts string and binary inputs for `data`.

If you use an unsupported type, an object for example, you will get this error:

```js
// WRONG
var data = {
    content: new ArrayBuffer(...)
};
zip.file("my.data", data); // won't work, data is an object

// CORRECT
var data = new ArrayBuffer(...);
zip.file("my.data", data); // will work, JSZip accepts ArrayBuffer
```

### My mac generates a `.cpgz` file when I try to extract the zip file

MacOS Finder has a lot of bug related to zip files (the `unzip` command line
tool is fine). When something goes wrong, Finder will generate this cpgz file
instead of showing an error.

To get a correct result, try to enable compression in `generateAsync`:

```js
zip.generateAsync({
    type:"...",
    compression: "DEFLATE" // <-- here
});
```

Using `platform: "UNIX"` may help too.
