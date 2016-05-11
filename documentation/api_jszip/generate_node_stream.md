---
title: "generateNodeStream(options[, onUpdate])"
layout: default
section: api
---

__Description__ : Generates the complete zip file as a nodejs stream.

__Arguments__

name                | type     | default | description
--------------------|----------|---------|------------
options             | object   |         | the options to generate the zip file, see [the options of `generateAsync()`]({{site.baseurl}}/documentation/api_jszip/generate_async.html)
onUpdate            | function |         | The optional function called on each internal update with the metadata.

The `type` parameter has here the default value of `nodebuffer`.
Only `nodebuffer` is currently supported.

__Metadata__ : see [the metadata of `generateAsync()`]({{site.baseurl}}/documentation/api_jszip/generate_async.html).

__Returns__ : a [nodejs Streams3](https://github.com/nodejs/readable-stream).

__Throws__ : Nothing.

__Example__

```js
zip
.generateNodeStream({streamFiles:true})
.pipe(fs.createWriteStream('out.zip'))
.on('finish', function () {
    // JSZip generates a readable stream with a "end" event,
    // but is piped here in a writable stream which emits a "finish" event.
    console.log("out.zip written.");
});
```
