---
title: "async(type[, onUpdate])"
layout: default
section: api
---

__Description__ : Return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) of the content in the asked type.

__Arguments__

name     | type     | description
---------|----------|------------
type     | String   | the type of the result : `string` (or `text`, its alias), `binarystring`, `base64`, `array`, `uint8array`, `arraybuffer`, `nodebuffer`.
onUpdate | Function | an optional function called on each internal update with the metadata.

__Metadata__ : the metadata are :

name        | type   | description
------------|--------|------------
percent     | number | the percent of completion (a double between 0 and 100)

__Returns__ : A [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) of the content.

__Throws__ : Nothing.

__Example__

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

```js
zip
.file("my_text.txt")
.async("string", function (meta) {
    console.log("Generating the content, we are at " + meta.percent.toFixed(2) + " %");
})
.then(...);
```


