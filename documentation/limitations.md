---
title: "Limitations of JSZip"
layout: default
section: limitations
fullpage: true
---

### Not supported features

All the features of zip files are not supported. Classic zip files will work
but encrypted zip, multi-volume, etc are not supported and the load() method
will throw an `Error`.


### ZIP64 and 32bit integers

ZIP64 files can be loaded, but only if the zip file is not "too big". ZIP64 uses 64bits integers
but Javascript represents all numbers as
[64-bit double precision IEEE 754 floating point numbers](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
(see section 8.5). So, we have 53bits for integers and
[bitwise operations treat everything as 32bits](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators).
So if all the 64bits integers can fit into 32 bits integers, everything will be
fine. If it's not the case, you will have other problems anyway (see next
limitation).

### Performance issues

An other limitation comes from the browser (and the machine running the
browser). A compressed zip file of 10MB is "easily" opened by firefox / chrome
/ opera / IE10+ but will crash older IE. Also keep in mind that strings in
javascript are encoded in UTF-16 : a 10MB ascii text file will take 20MB of
memory.

If you're having performance issues, please consider the following :

* Don't use IE &lt;= 9. Everything is better with typed arrays.
* Use typed arrays (Uint8Array, ArrayBuffer, etc) if possible :
  * If you generate a zip file, you should use `type:"uint8array"`
    (or blob, arraybuffer, nodebuffer).
  * If you load the file from an ajax call, ask your XHR an ArrayBuffer.
    Loading a string is asking for troubles.
* Don't use compression (see below).
* If you want to get the content of an ASCII file as a string, consider using
  `asBinary()` instead of `asText()`. The transformation
  "binary string" -&gt; "unicode string" is a consuming process.

Note about compression :
When reading a file, JSZip will store the content without decompressing it.
When generating a compressed file, JSZip will reuse if possible compressed
content :

* If you read a zip file compressed with DEFLATE and call `generate` with the
  DEFLATE compression, JSZip won't call the compression algorithms (same with
  STORE everywhere.)
* If you read a zip file compressed with DEFLATE and call `generate` with the
  STORE compression, JSZip will have to decompress everything.

On IE &lt;=9, typed arrays are not supported and the compression algorithm
will fallback on arrays. In that case, JSZip needs to convert the binary string
into an array, DEFLATE it and convert the result into a binary string.
You don't want that to happen.

### The output zip will differ from the input zip

Reading and generating a zip file won't give you back the same file.
Some data are discarded (file metadata) and other are added (subfolders).

### Encodings support

JSZip only supports utf8 : if the names of the files inside the zip are not in
utf8 (or ASCII), they won't be interpreted correctly. If the content is a text
not encoded with utf8 (or ASCII), the `asText()` method won't decode it
correctly.
