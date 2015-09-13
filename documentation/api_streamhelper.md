---
title: "StreamHelper API"
layout: default
section: api
---

A `StreamHelper` can be viewed as a pausable stream with some helper methods.
It is not a full featured stream like in nodejs (and can't directly used as one)
but the exposed methods should be enough to write the glue code with other async
libraries : `on('data', function)`, `on('end', function)` and `on('error', function)`.

It starts paused, be sure to `resume()` it when ready.

If you are looking for an asynchronous helper without writing glue code, take a
look at `accumulate(function)`.
