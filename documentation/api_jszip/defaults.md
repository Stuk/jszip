---
title: "JSZip.defaults"
layout: default
section: api
---

__Deprecated__: `JSZip.defaults` is deprecated and will be removed in a future
version. Prefer passing the options to each `file()` or `generateAsync()`
call instead.

The global defaults object. It holds the options applied when a file or
folder is added without explicit options:

* `base64` : `false` by default.
* `binary` : `false` by default.
* `dir` : `false` by default.
* `createFolders` : `true` by default.
* `date` : `null` by default (the current date is used).
* `compression` : `null` by default (STORE).
* `compressionOptions` : `null` by default.
* `comment` : `null` by default.
* `unixPermissions` : `null` by default.
* `dosPermissions` : `null` by default.

Reading or writing `JSZip.defaults` prints a deprecation warning. Mutating
the object still changes the options applied to new files and folders, and
assigning a new object merges its properties into it.

## Example

```js
// deprecated, prefer per-call options instead:
JSZip.defaults.date = new Date("2020-01-01");

// preferred:
zip.file("hello.txt", "Hello World", {date: new Date("2020-01-01")});
```
