---
title: "async(type[, onUpdate])"
layout: default
section: api
---

Return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) of the content in the asked type.

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) of the content.

__Since__: v3.0.0

## Arguments

name     | type     | description
---------|----------|------------
type     | String   | the type of the result. [More](#type-option).
onUpdate | Function | an optional function called on each internal update with the metadata. [More](#onupdate-callback).

### `type` option

Possible values for `type` :

* `base64` : the result will be a string, the binary in a base64 form.
* `text` (or `string`): the result will be an unicode string.
* `binarystring`: the result will be a string in "binary" form, using 1 byte per char (2 bytes).
* `array`: the result will be an Array of bytes (numbers between 0 and 255).
* `uint8array` : the result will be a Uint8Array. This requires a compatible browser.
* `arraybuffer` : the result will be a ArrayBuffer. This requires a compatible browser.
* `blob` : the result will be a Blob. This requires a compatible browser.
* `nodebuffer` : the result will be a nodejs Buffer. This requires nodejs.

Note : when using type = "uint8array", "arraybuffer" or "blob", be sure to
check if the browser supports it (you can use [`JSZip.support`]({{site.baseurl}}/documentation/api_jszip/support.html)).

```js
zip.file("image.png").async({type: "uint8array"}).then(function (u8) {
    // ...
});
```

### `onUpdate` callback

If specified, this function will be called each time a chunk is pushed to the
output stream (or internally accumulated).

The function takes a `metadata` object which contains informations about the
ongoing process.

__Metadata__ : the metadata are :

name        | type   | description
------------|--------|------------
percent     | number | the percent of completion (a double between 0 and 100)

```js
zip.file("image.png").async({type: "uint8array"}, function updateCallback(metadata) {
    console.log("progression: " + metadata.percent.toFixed(2) + " %");
}).then(function (u8) {
    // ...
})
```


## Other examples

```js
zip
.file("my_text.txt")
.async("string")
.then(function success(content) {
    // use the content
}, function error(e) {
    // handle the error
});
```
