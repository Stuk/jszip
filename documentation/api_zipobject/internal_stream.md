---
title: "internalStream(type)"
layout: default
section: api
---

Return a [StreamHelper]({{site.baseurl}}/documentation/api_streamhelper.html)
of the content in the asked type.

__Returns__ : a [StreamHelper]({{site.baseurl}}/documentation/api_streamhelper.html)
of the content in the asked type.

## Arguments

name     | type     | description
---------|----------|------------
type     | String   | the type of the result: `string`, `binarystring`, `uint8array`, `arraybuffer`, `nodebuffer`.


## Example

```js
zip
.file("my_text.txt")
.internalStream("string")
.on("data", function (data) {...})
.on("error", function (e) {...})
.on("end", function () {...});
```

