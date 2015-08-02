---
title: "accumulate(callback [,updateCallback])"
layout: default
section: api
---

__Description__ : Read the whole stream and call a callback with the complete content.

__Arguments__

name            | type     | description
----------------|----------|------------
callback        | function | the function called once when the final content is ready.
updateCallback  | function | the function called every time the stream updates. This function is optional.


The callback function takes 2 parameters :
- the error if any
- the complete content

The update callback function takes 1 parameter : the metadata (see the [`on` method]({{site.baseurl}}/documentation/api_streamhelper/on.html)).

__Returns__ : Nothing.

__Throws__ : Nothing.

__Example__

```js
zip
.generateInternalStream({type:"uint8array"})
.accumulate(function callback(err, data) {
    // err contains the error if something went wrong, null otherwise.
    // data contains here the complete zip file as a uint8array (the type asked in generateInternalStream)
}, function updateCallback(metadata) {
    // metadata contains for example currentFile and percent, see the generateInternalStream doc.
});
```
