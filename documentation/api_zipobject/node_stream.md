---
title: "nodeStream(type[, onUpdate])"
layout: default
section: api
---

Return a [nodejs Streams3](https://github.com/nodejs/readable-stream)
of the content in the asked type.

__Returns__ : a [nodejs Streams3](https://github.com/nodejs/readable-stream).

## Arguments

name     | type     | default      | description
---------|----------|--------------|------------
type     | String   | `nodebuffer` | only `nodebuffer` is currently supported.
onUpdate | Function |              | an optional function called on each internal update with the metadata.

__Metadata__ : see [the metadata of `async()`]({{site.baseurl}}/documentation/api_zipobject/async.html#onupdate-callback).

## Example

```js
zip
.file("my_text.txt")
.nodeStream()
.pipe(fs.createWriteStream('/tmp/my_text.txt'))
.on('finish', function () {
    // JSZip generates a readable stream with a "end" event,
    // but is piped here in a writable stream which emits a "finish" event.
    console.log("text file written.");
});
```
