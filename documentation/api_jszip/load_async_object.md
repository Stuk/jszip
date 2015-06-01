---
title: "JSZip.loadAsync(data [, options])"
layout: default
section: api
---

This is a shortcut for

```js
var zip = new JSZip();
zip.loadAsync(data, options);
```

Please see the documentation of [loadAsync]({{site.baseurl}}/documentation/api_jszip/load_async.html).


__Examples__

```js
dataAsPromise
.then(JSZip.loadAsync)
.then(function(zip) {...})
```
