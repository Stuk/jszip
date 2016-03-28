---
title: "resume()"
layout: default
section: api
---

Resume the stream if the stream is paused. Once resumed, the stream starts
sending `data` events again.

__Returns__ : The current StreamHelper object, for chaining.

__Since__: v3.0.0

## Example

```js
zip
.generateInternalStream({type:"uint8array"})
.on('data', function() {...})
.resume();
```
