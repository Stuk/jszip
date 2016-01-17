---
title: "JSZip.external"
layout: default
section: api
---

JSZip uses polyfills of objects that may not exist on every platform.
Accessing or replacing these objects can sometimes be useful. JSZip.external
contains the following properties :

* `Promise` : the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) implementation used.

__Example__

```js
// use bluebird instead
JSZip.external.Promise = Bluebird;

// use the native Promise object:
JSZip.external.Promise = Promise;
```

