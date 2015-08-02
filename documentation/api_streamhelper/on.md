---
title: "on(event, callback)"
layout: default
section: api
---

__Description__ : Register a listener on an event.

__Arguments__

name      | type     | description
----------|----------|------------
event     | string   | the name of the event. Only 3 events are supported : `data`, `end` and `error`.
callback  | function | the function called when the event occurs. See below for the arguments.


A `data` callback takes 2 parameters :

- the current chunk of data (in a format specified by the method which
  generated this StreamHelper)
- the metadata (see each method to know what's inside)

A `end` callback does not take any parameter.

A `error` callback takes an `Error` as parameter.

The callbacks are executed in with the current `StreamHelper` as `this`.

__Returns__ : The current StreamHelper object, for chaining.

__Throws__ : An exception if the event is unkown.

__Example__

```js
zip
.generateInternalStream({type:"uint8array"})
.on('data', function (data, metadata) {
    // data is a Uint8Array because that's the type asked in generateInternalStream
    // metadata contains for example currentFile and percent, see the generateInternalStream doc.
})
.on('error', function (e) {
    // e is the error
})
.on('end', function () {
    // no parameter
})
.resume();
```
