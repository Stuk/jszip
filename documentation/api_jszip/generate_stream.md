---
title: "generateStream(options)"
layout: default
section: api
---

__Description__ : Generates the complete zip file asynchronously.

__Arguments__

name                | type     | default | description
--------------------|----------|---------|------------
options             | object   |         | the options to generate the zip file, see [the options of `generate()`]({{site.baseurl}}/documentation/api_jszip/generate.html)

__Metadata__ : this stream generates the following metadata :

name        | type   | description
------------|--------|------------
currentFile | string | the name of the file currently added to the zip file, `null` if none
percent     | number | the percent of completion (a double between 0 and 100)

__Returns__ : a [StreamHelper]({{site.baseurl}}/documentation/api_streamhelper.html).

__Throws__ : Nothing.

__Example__

```js
zip.generateStream({type:"blob"}).accumulate(function callback(err, content) {
  if (err) {
    // handle error
  }
  // see FileSaver.js
  saveAs(content, "hello.zip");
}, function updateCallback(metadata) {
  // print progression with metadata.percent and metadata.currentFile
});
```
