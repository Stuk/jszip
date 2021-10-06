---
title: "How to create a zip from a FormData object"
layout: default
section: example
---

When submitting a `multipart/form-data`, a FormData can be generated automatically:

```js
$(form).on('submit', e => {
  e.preventDefault();
  const form = new FormData(e.target);
  
  // ...
});
```

To convert from the FormData to zip all of the files, you can parse it easily and add all of the files to the zip:

```

$('form#myform').on('submit', e => {
  e.preventDefault();
  const form = new FormData(e.target);
  
  const zip = new JSZip()
  for (let [key, value] of form.entries()) {
    if (value instanceof File) {
      zip.file(key, value);
      form.delete(key);   // No longer needed it here
    }
  }
  
  // ...
});
```

Now you have all of the files uploaded in the form within a single zip, and can proceed with it as you desire.
