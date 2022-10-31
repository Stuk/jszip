---
title: Contributing
layout: default
section: main
---


### Download the sources

You should create a [Github](https://github.com/) account and
[fork the repository](https://help.github.com/articles/fork-a-repo) (you will
need one to create the pull request).

If you just want the get the source code, you can use git and do
`git clone https://github.com/Stuk/jszip.git` to get the sources. You can also
download the latest sources [here](https://github.com/Stuk/jszip/archive/main.zip).

### Building the project

#### Code

The dependencies are handled by npm, the first step is to run
`npm install` to get the dependencies.
JSZip uses Grunt to handle the build, [see here to install its CLI](http://gruntjs.com/getting-started).

Here are the interesting build commands :

* `grunt` will generate the final js file in dist/ and the minified version.
* `npm run test-node` will run the tests in nodejs.
* `npm run test-browser` will the tests in some browsers using SauceLabs, see
  below.
* `npm run test` will run the tests in nodejs and in the browser.
* `npm run lint` will use eslint the check the source code.

#### Documentation

The documentation uses jekyll on gh-pages. To render the documentation, you
need to [install jekyll](http://jekyllrb.com/docs/installation/) and then run
`jekyll serve --baseurl ''`.

### Testing the project

To test JSZip in nodejs, use `npm run test-node`.

To test JSZip in a browser, you can open the file `test/index.html` in the
browser you want to test. Don't forget to update the dist/ files with `grunt`.

You can also test JSZip in a lot of browsers at once with
[SauceLabs](https://saucelabs.com/). You will need a SauceLabs account and two
variables into your environment. On linux, just use

```bash
export SAUCE_USERNAME=your-saucelabs-username
export SAUCE_ACCESS_KEY=your-saucelabs-access-key
```

before running the `npm run test-browser` command.

### Merging the changes

If you have tested bug fixes or new features, you can open a
[pull request](https://help.github.com/articles/using-pull-requests) on Github.

## Releasing a new version

1. In `package.json` temporarily remove `browser["./lib/index"]`.
2. Run `npm test`
    * Locally open http://localhost:8080/test/
    * Or use the SauceLabs configuration above
3. Update `JSZip.version` in `index.js`, `index.html` and in `package.json`
4. Run `grunt` to generate the new dist files
    * undo the package.json change, it was just needed to replace the `__VERSION__` in the header
5. Undo step 1.
6. Change version back in `package.json` (it will get update by the npm command below)
7. Update CHANGES.md
8. Commit the appropriate changes
9. Run `npm version ...` where `...` is `major`, `minor`, or `patch`
10. Run npm publish
