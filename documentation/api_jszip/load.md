---
title: "load(data [, options])"
layout: default
section: api
---

__Description__ : Read an existing zip and merge the data in the current JSZip
object at the current folder level. This technique has some limitations, see
[here]({{site.baseurl}}/documentation/limitations.html).

__Arguments__

name               | type   | description
-------------------|--------|------------
data               | String/ArrayBuffer/Uint8Array/Buffer | the zip file
options            | object | the options to load the zip file

Content of `options` :

name                          | type    | default | description
------------------------------|---------|---------|------------
options.base64                | boolean | false   | set to `true` if the data is base64 encoded, `false` for binary.
options.checkCRC32            | boolean | false   | set to `true` if the read data should be checked against its CRC32.
options.optimizedBinaryString | boolean | false   | set to true if (and only if) the input is a string and has already been prepared with a 0xFF mask.

You shouldn't update the data given to this method : it is kept as it so any
update will impact the stored data.

Zip features supported by this method :

* Compression (<code>DEFLATE</code> supported)
* zip with data descriptor
* ZIP64
* UTF8 in file name, UTF8 in file content

Zip features not (yet) supported :

* password protected zip
* multi-volume zip

__Returns__ : The current JSZip object.

__Throws__ : An exception if the loaded data is not valid zip data or if it
uses features (multi volume, password protected, etc).

<!--
__Complexity__ : for k the number of entries in the zip file and n the length
of the data :

The default use case is **O(k)**.
If the data is in base64, we must first decode it : **O(k + n)**.
If the data is a string not in base64 and optimizedBinaryString is false, we
must apply the 0xFF mask : **O(k + n)**.
If checkCRC32 is true, it **adds** to the above complexity **O(n)** and the
complexity of the decompression algorithm.
-->

__Example__

```js
var zip = new JSZip();
zip.load(zipDataFromXHR);
```

```js
require("fs").readFile("hello.zip", function (err, data) {
  if (err) throw err;
  var zip = new JSZip();
  zip.load(data);
}
```

Using sub folders :

```js
var zip = new JSZip();
zip.folder("subfolder").load(data);
// the content of data will be loaded in subfolder/
```

