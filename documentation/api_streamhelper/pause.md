---
title: "pause()"
layout: default
section: api
---

Pause the stream if the stream is running. Once paused, the
stream stops sending `data` events.

__Returns__ : The current StreamHelper object, for chaining.

## Example

```js
zip
.generateInternalStream({type:"uint8array"})
.on('data', function(chunk) {

    // if we push the chunk to an other service which is overloaded, we can
    // pause the stream as backpressure.
    this.pause();

}).resume(); // start the stream the first time
```

