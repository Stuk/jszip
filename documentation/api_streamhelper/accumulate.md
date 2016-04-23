---
title: "accumulate([updateCallback])"
layout: default
section: api
---

__Description__ : Read the whole stream and call a callback with the complete content.

__Arguments__

name            | type     | description
----------------|----------|------------
updateCallback  | function | the function called every time the stream updates. This function is optional.


The update callback function takes 1 parameter : the metadata (see the [`on` method]({{site.baseurl}}/documentation/api_streamhelper/on.html)).

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
of the full content.

__Throws__ : Nothing.

__Example__

```js
zip
.generateInternalStream({type:"uint8array"})
.accumulate(function updateCallback(metadata) {
    // metadata contains for example currentFile and percent, see the generateInternalStream doc.
}).then(function (data) {
    // data contains here the complete zip file as a uint8array (the type asked in generateInternalStream)
});
```
