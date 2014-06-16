---
title: "generateAsync(options, callback)"
layout: default
section: api
---

__Description__ : Generates the complete zip file asynchronously.

__Arguments__

name                | type     | default | description
--------------------|----------|---------|------------
options             | object   |         | the options to generate the zip file, see [the options of `generate()`]({{site.baseurl}}/documentation/api_jszip/generate.html)
callback            | function |         | the function to call with the result.


The callback has the following signature : `function(err, content) {...}`

__Returns__ : Nothing.

__Throws__ : Nothing.

__Example__

```js
zip.generateAsync({type:"blob"}, function(err, content) {
  if (err) {
    // handle error
  }
  // see FileSaver.js
  saveAs(content, "hello.zip");
});
```

```js
zip.generateAsync({type:"base64"}, function(err, content) {
  if (err) {
    // handle error
  }
  location.href="data:application/zip;base64,"+content;
});
```

```js
zip.generateAsync({type:"nodebuffer"}, function(err, content) {
  if (err) {
    // handle error
  }
  require("fs").writeFile("hello.zip", content, function(err){/*...*/});
});
```



