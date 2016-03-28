---
title: "file(name)"
layout: default
section: api
---

Get a file with the specified name. You can specify folders
in the name : the folder separator is a forward slash ("/").

__Returns__ : An instance of [ZipObject]({{site.baseurl}}/documentation/api_zipobject.html) representing
the file if any, `null` otherwise.

__Since__: v1.0.0

## Arguments

name | type   | description
-----|--------|-------------
name | string | the name of the file.

__Throws__ : Nothing.

<!-- __Complexity__ : This is a simple lookup in **O(1)**. -->

## Example

```js
var zip = new JSZip();
zip.file("file.txt", "content");

zip.file("file.txt").name // "file.txt"
zip.file("file.txt").async("string") // a promise of "content"
zip.file("file.txt").dir // false

// utf8 example
var zip = new JSZip();
zip.file("amount.txt", "€15");
zip.file("amount.txt").async("string") // a promise of "€15"
zip.file("amount.txt").async("arraybuffer") // a promise of an ArrayBuffer containing €15 encoded as utf8
zip.file("amount.txt").async("uint8array") // a promise of an Uint8Array containing €15 encoded as utf8

// with folders
zip.folder("sub").file("file.txt", "content");
zip.file("sub/file.txt"); // the file
// or
zip.folder("sub").file("file.txt") // the file
```


