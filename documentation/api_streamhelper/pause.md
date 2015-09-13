---
title: "pause()"
layout: default
section: api
---

__Description__ : Pause the stream if the stream is running. Once paused, the
stream stops sending `data` events.

__Arguments__ : None.

__Returns__ : The current StreamHelper object, for chaining.

__Throws__ : Nothing.

__Example__

```js
zip
.generateInternalStream({type:"uint8array"})
.on('data', function(chunk) {

    // if we push the chunk to an other service which is overloaded, we can
    // pause the stream as backpressure.
    this.pause();

}).resume(); // start the stream the first time
```

