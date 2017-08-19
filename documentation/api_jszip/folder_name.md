---
title: "folder(name)"
layout: default
section: api
---

Create a directory if it doesn't exist, return a new JSZip
object with the new folder as root.

See also [the `dir` option of file()]({{site.baseurl}}/documentation/api_jszip/file_data.html).

__Returns__ : A new JSZip (for chaining), with the new folder as root.

__Since__: v1.0.0

## Arguments

name | type   | description
-----|--------|------------
name | string | the name of the directory.

## Examples

```js
zip.folder("images");
zip.folder("css").file("style.css", "body {background: #FF0000}");
// or specify an absolute path (using forward slashes)
zip.file("css/font.css", "body {font-family: sans-serif}")

// result : images/, css/, css/style.css, css/font.css
```

