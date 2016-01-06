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
.on('end', function () {
    console.log("out.zip written.");
});
```
