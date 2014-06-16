---
title: "ZipObject API"
layout: default
section: api
---

This represents an entry in the zip file. If the entry comes from an existing
archive previously [loaded]({{site.baseurl}}/documentation/api_jszip/load.html), the content
will be automatically decompressed/converted first.

### Attributes

attribute name       | type        | description
---------------------|-------------|-------------
`name`               | string      | the absolute path of the file
`dir`                | boolean     | true if this is a directory
`date`               | date        | the last modification date
`comment`            | string      | the comment for this file
`options`            | object      | the options of the file. The available options are :
`options.base64`     | boolean     | **Deprecated**, see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.binary`     | boolean     | **Deprecated**, see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.dir`        | boolean     | **Deprecated**, use `dir`. True if this is a directory
`options.date`       | date        | **Deprecated**, use `date`. See [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.compression`| compression | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)


### Getters

method            | return type   | description
------------------|---------------|-------------
`asText()`        | string        | the content as an unicode string.
`asTextAsync(callback)`        | - | the content as an unicode string, asynchronous version.
`asBinary()`      | string        | the content as binary string.
`asBinaryAsync(callback)`      | - | the content as binary string, asynchronous version.
`asArrayBuffer()` | ArrayBuffer   | need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asArrayBufferAsync(callback)` | - | asynchronous version, need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asUint8Array()`  | Uint8Array    | need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asUint8ArrayAsync(callback)`  | - | asynchronous version, need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asNodeBuffer()`  | nodejs Buffer | need [nodejs]({{site.baseurl}}/documentation/api_jszip/support.html).
`asNodeBufferAsync(callback)`  | - | asynchronous version, need [nodejs]({{site.baseurl}}/documentation/api_jszip/support.html).

The *Async() methods take a function as callback. The callback has the following
signature : `function(err, content) {...}`


__Example__

```js
var txt = zip.file("my_text.txt").asText();

zip.file("my_text.txt").asTextAsync(function (err, content) {
  if (err) {
    // handle error
  }
  // the content var contains the text
});
```

