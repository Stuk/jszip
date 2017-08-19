---
title: "ZipObject API"
layout: default
section: api
---

This represents an entry in the zip file. If the entry comes from an existing
archive previously [loaded]({{site.baseurl}}/documentation/api_jszip/load_async.html), the content
will be automatically decompressed/converted first.

### Attributes

attribute name              | type        | description
----------------------------|-------------|-------------
`name`                      | string      | the absolute path of the file
`dir`                       | boolean     | true if this is a directory
`date`                      | date        | the last modification date
`comment`                   | string      | the comment for this file
`unixPermissions`           | 16 bits number | The UNIX permissions of the file, if any.
`dosPermissions`            | 6 bits number  | The DOS permissions of the file, if any.
`options`                   | object      | the options of the file. The available options are :
`options.compression`       | compression | see [file(name, data [,options])]({{site.baseurl}}/documentation/api_jszip/file_data.html)

Example:

```js
{ name: 'docs/',
  dir: true,
  date: 2016-12-25T08:09:27.153Z,
  comment: null,
  unixPermissions: 16877,
  dosPermissions: null,
  options: {
    compression: 'STORE',
    compressionOptions: null
  }
}
```

```js
{ name: 'docs/list.txt',
  dir: false,
  date: 2016-12-25T08:09:27.152Z,
  comment: null,
  unixPermissions: 33206,
  dosPermissions: null,
  options: {
    compression: 'DEFLATE',
    compressionOptions: null
  }
}
```
