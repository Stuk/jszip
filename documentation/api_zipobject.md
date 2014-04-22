---
title: "ZipObject API"
layout: default
section: api
---

This represents an entry in the zip file. If the entry comes from an existing
archive previously [loaded]({{site.baseurl}}/documentation/api_jszip/load.html), the content may need to be
decompressed/converted first.

### Attributes

attribute name       | type        | description
---------------------|-------------|-------------
`name`               | string      | the absolute path of the file
`options`            | object      | the options of the file. The available options are :
`options.base64`     | boolean     | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.binary`     | boolean     | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.dir`        | boolean     | true if this is a directory
`options.date`       | date        | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
`options.compression`| compression | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)


### Getters

method            | return type   | description
------------------|---------------|-------------
`asText()`        | string        | the content as an unicode string.
`asBinary()`      | string        | the content as binary string.
`asArrayBuffer()` | ArrayBuffer   | need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asUint8Array()`  | Uint8Array    | need a [compatible browser]({{site.baseurl}}/documentation/api_jszip/support.html).
`asNodeBuffer()`  | nodejs Buffer | need [nodejs]({{site.baseurl}}/documentation/api_jszip/support.html).
