---
title: "copy(from, to)"
layout: default
section: api
---

Copy a file or folder (recursively).

__Returns__ : The current JSZip object.

__Since__: vX.X.X

## Arguments

name | type   | description
-----|--------|------------
from | string | the current name of the file/folder to copy.
to | string | the new name of the file/folder to copy.

## Examples

```js
var zip = new JSZip();
zip.file("Hello.txt", "Hello World\n");
zip.copy("Hello.txt", "HelloWord.txt");

zip.folder("css").file("style.css", "body {background: #FF0000}");
zip.copy("css", "css_2");
```


