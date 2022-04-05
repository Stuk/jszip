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
zip
.generateInternalStream({type:"uint8array"})
.accumulate()
.then(function (data) {
    // data contains here the complete zip file as a uint8array (the type asked in generateInternalStream)
});
```
