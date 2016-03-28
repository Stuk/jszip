---
title: "remove(name)"
layout: default
section: api
---

Delete a file or folder (recursively).

__Returns__ : The current JSZip object.

__Since__: v1.0.0

## Arguments

name | type   | description
-----|--------|------------
name | string | the name of the file/folder to delete.

## Examples

```js
var zip = new JSZip();
zip.file("Hello.txt", "Hello World\n");
zip.file("temp.txt", "nothing").remove("temp.txt");
// result : Hello.txt

zip.folder("css").file("style.css", "body {background: #FF0000}");
zip.remove("css");
//result : empty zip
```


