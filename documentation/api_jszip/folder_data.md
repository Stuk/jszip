---
title: "folder(name)"
layout: default
section: api
---

__Description__ : Add a directory to the zip file.

__Arguments__

name | type   | description
-----|--------|------------
name | string | the name of the directory.

__Returns__ : A new JSZip (for chaining), with the new folder as root.

__Throws__ : Nothing.

<!-- __Complexity__ : **O(1)** -->

__Example__

```js
zip.folder("images");
zip.folder("css").file("style.css", "body {background: #FF0000}");
// or specify an absolute path (using forward slashes)
zip.file("css/font.css", "body {font-family: sans-serif}")

// result : images/, css/, css/style.css, css/font.css
```

