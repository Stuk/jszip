---
title: "stream(type[, onUpdate])"
layout: default
section: api
---

__Description__ : Return a [nodejs Streams3](https://github.com/nodejs/readable-stream)
of the content in the asked type.

__Arguments__

name     | type     | description
---------|----------|------------
type     | String   | the type of the result : `string`, `binarystring`, `uint8array`, `arraybuffer`, `nodebuffer`.
onUpdate | Function | an optional function called on each internal update with the metadata.

__Metadata__ : see [the metadata of `async()`]({{site.baseurl}}/documentation/api_zipobject/async.html).

__Returns__ : a [nodejs Streams3](https://github.com/nodejs/readable-stream).

__Throws__ : Nothing.

__Example__

```js
zip
.file("my_text.txt")
.stream("nodebuffer")
.pipe(fs.createWriteStream('/tmp/my_text.txt'))
.on("end", function () {...});
```
