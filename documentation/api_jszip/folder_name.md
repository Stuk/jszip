---
title: "folder(name [,options])"
layout: default
section: api
---

Create a directory if it doesn't exist, return a new JSZip
object with the new folder as root.

See also [the `dir` option of file()]({{site.baseurl}}/documentation/api_jszip/file_data.html).

__Returns__ : A new JSZip (for chaining), with the new folder as root.

__Since__: v1.0.0

## Arguments

name    | type   | description
--------|--------|------------
name    | string | the name of the directory.
options | object | the options.

Content of `options` :

name        | type    | default | description
------------|---------|---------|------------
date        | date    | the current date | the last modification date.
comment     | string  | null    | The comment for this folder.
createFolders | boolean | `true` | Set to true if folders in the folder path should be automatically created, otherwise there will only be virtual folders that represent the path to the folder.
unixPermissions | 16 bits number | null    | The UNIX permissions of the folder, if any.
dosPermissions  | 6 bits number  | null    | The DOS permissions of the folder, if any.

Options such as `unixPermissions`, `dosPermissions`, `date` or `comment` only
apply to the specified folder, not to the automatically created parent
folders: `zip.folder("a/b", options)` behaves like
`zip.folder("a").folder("b", options)`. If the folder already exists, the
options are ignored.

See [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)
for the details of these options.

## Examples

```js
zip.folder("images");
zip.folder("css").file("style.css", "body {background: #FF0000}");
// or specify an absolute path (using forward slashes)
zip.file("css/font.css", "body {font-family: sans-serif}")
// or create a folder with options
zip.folder("executables", {unixPermissions: "40755"});

// result : images/, css/, css/style.css, css/font.css, executables/
```

