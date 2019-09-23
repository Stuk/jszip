---
title: "rename(from, to)"
layout: default
section: api
---

rename a file or folder (recursively).

__Returns__ : The current JSZip object.

__Since__: vX.X.X

## Arguments

name | type   | description
-----|--------|------------
from | string | the old name of the file/folder to rename.
to | string | the new name of the file/folder to rename.

## Examples

```js
var zip = new JSZip();
zip.file("Hello.txt", "Hello World\n");
zip.rename("Hello.txt", "HelloWord.txt");

zip.folder("css").file("style.css", "body {background: #FF0000}");
zip.rename("css", "css_2");
```


