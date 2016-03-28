---
title: "generateInternalStream(options)"
layout: default
section: api
---

Generates the complete zip file with the internal stream implementation.

__Returns__ : a [StreamHelper]({{site.baseurl}}/documentation/api_streamhelper.html).

__Since__: v3.0.0

## Arguments

name                | type     | default | description
--------------------|----------|---------|------------
options             | object   |         | the options to generate the zip file, see [the options of `generateAsync()`]({{site.baseurl}}/documentation/api_jszip/generate_async.html)

__Metadata__ : see [the metadata of `generateAsync()`]({{site.baseurl}}/documentation/api_jszip/generate_async.html#onupdate-callback).

## Examples

```js
zip.generateInternalStream({type:"blob"}).accumulate(function callback(err, content) {
  if (err) {
    // handle error
  }
  // see FileSaver.js
  saveAs(content, "hello.zip");
}, function updateCallback(metadata) {
  // print progression with metadata.percent and metadata.currentFile
});
```
