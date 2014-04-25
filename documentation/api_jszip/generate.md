---
title: "generate(options)"
layout: default
section: api
---

__Description__ : Generates the complete zip file.

__Arguments__

name                | type    | default | description
--------------------|---------|---------|------------
options             | object  |         | the options to generate the zip file :
options.base64      | boolean | false   | **deprecated**, use `type` instead. If `type` is not used, set to `false` to get the result as a raw byte string, `true` to encode it as base64.
options.compression | string  | `STORE` (no compression) | the default file compression method to use. Available methods are `STORE` and `DEFLATE`. You can also provide your own compression method.
options.type        | string  | `base64` | The type of zip to return, see below for the other types.

Possible values for `type` :

* `base64` (default) : the result will be a string, the binary in a base64 form.
* `string` : the result will be a string in "binary" form, using 1 byte per char (2 bytes).
* `uint8array` : the result will be a Uint8Array containing the zip. This requires a compatible browser.
* `arraybuffer` : the result will be a ArrayBuffer containing the zip. This requires a compatible browser.
* `blob` : the result will be a Blob containing the zip. This requires a compatible browser.
* `nodebuffer` : the result will be a nodejs Buffer containing the zip. This requires nodejs.

Note : when using type = "uint8array", "arraybuffer" or "blob", be sure to
check if the browser supports it (you can use [`JSZip.support`]({{site.baseurl}}/documentation/api_jszip/support.html)).

__Returns__ : The generated zip file.

__Throws__ : An exception if the asked `type` is not available in the browser,
see [JSZip.support]({{site.baseurl}}/documentation/api_jszip/support.html).

<!-- __Complexity__ : TODO : worst case, with/out compression, etc -->

__Example__

```js
var content = zip.generate({type:"blob"});
// see FileSaver.js
saveAs(content, "hello.zip");
```

```js
var content = zip.generate({type:"base64"});
location.href="data:application/zip;base64,"+content;
```

```js
var content = zip.generate({type:"nodebuffer"});
require("fs").writeFile("hello.zip", content, function(err){/*...*/});
```


