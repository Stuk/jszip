---
title: "file(regex)"
layout: default
section: api
---

Search a file in the current folder and subfolders with a
[regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions).
The regex is tested against the relative filename.

__Returns__ : An array of matching files (an empty array if none matched). Each
matching file is an instance of [ZipObject]({{site.baseurl}}/documentation/api_zipobject.html).

__Since__: v1.0.0

## Arguments

name  | type   | description
------|--------|------------
regex | RegExp | the regex to use.

## Example

```js
var zip = new JSZip();
zip.file("file1.txt", "content");
zip.file("file2.txt", "content");

zip.file(/file/); // array of size 2

// example with a relative path :
var folder = zip.folder("sub");
folder
  .file("file3.txt", "content")  // relative path from folder : file3.txt
  .file("file4.txt", "content"); // relative path from folder : file4.txt

folder.file(/file/);  // array of size 2
folder.file(/^file/); // array of size 2, the relative paths start with file

// arrays contain objects in the form:
// {name: "file2.txt", dir: false, async : function () {...}, ...}
```


