/* global QUnit,test,ok,equal,start,stop */
/* global JSZip,JSZipTestUtils */
'use strict';


//var JSZip = require('../lib');
function similar(actual, expected, mistakes) {

   if(JSZip.support.arraybuffer) {
      if(actual instanceof ArrayBuffer) {
         actual = new Uint8Array(actual);
      }
      if(expected instanceof ArrayBuffer) {
         expected = new Uint8Array(expected);
      }
   }

   var actualIsString = typeof actual === "string";
   var expectedIsString = typeof expected === "string";

   if (actual.length !== expected.length) {
      mistakes -= Math.abs((actual.length||0) - (expected.length||0));
   }

   for (var i = 0; i < Math.min(actual.length, expected.length); i++) {
      // actual is the generated zip, expected is what we got from the xhr.
      var actualByte = actualIsString ? actual.charCodeAt(i) : actual[i];
      // expected can be a string with char codes > 255, be sure to take only one byte.
      var expectedByte = (expectedIsString ? expected.charCodeAt(i) : expected[i]) & 0xFF;
      if (actualByte !== expectedByte) {
         mistakes--;
      }
   }

   if (mistakes < 0) {
      return false;
   } else {
      return true;
   }
}

/*
   Expected differing bytes:
   2  version number
   4  date/time
   4  central dir version numbers
   4  central dir date/time
   4  external file attributes

   18 Total
   */
var MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY = 18;

function checkGenerateStability(bytesStream, options) {
   stop();

   options = options || {type:"binarystring"};
   // TODO checkcrc32
   new JSZip(bytesStream).generateAsync(options).then(function (content) {
      start();
      ok(similar(bytesStream, content, 0), "generate stability : stable");
   })['catch'](assertNoError);
}

function checkBasicStreamBehavior(stream, testName) {
   stop();
   if (!testName) {
      testName = "";
   }
   var triggeredStream = false;
   stream
   .on("data", function (data, metadata) {
      // triggering a lot of passing checks makes the result unreadable
      if (!data) {
         ok(data, testName + "basic check stream, data event handler, data is defined");
      }
      if(!metadata) {
         ok(metadata, testName + "basic check stream, data event handler, metadata is defined");
      }
      triggeredStream = true;
   })
   .on("error", function (e) {
      ok(e, testName + "basic check stream, error event handler, error is defined");
      triggeredStream = true;
      start();
   })
   .on("end", function () {
      triggeredStream = true;
      start();
   })
   .resume()
   ;
   ok(!triggeredStream, testName + "basic check stream, the stream callback is async");
}

// cache for files
var refZips = {};

function fetchFile(index, url, callback) {
   if(refZips[url]) {
      setTimeout(function () {
         callback(index, null, refZips[url]);
      }, 0);
   } else {
      JSZipTestUtils.loadZipFile(url, function (err, res) {
         var file = JSZip.utils.transformTo("string", res);
         refZips[url] = file;
         callback(index, err, file);
      });
   }
}

function assertNoError(err) {
   ok(false, "unexpected error : " + err + ",  " + err.stack);
}

function testZipFile(testName, zipName, testFunction) {
   var simpleForm = !(zipName instanceof Array);
   var filesToFetch = [];
   if(simpleForm) {
      filesToFetch = [zipName];
   } else {
      filesToFetch = zipName;
   }

   test(testName, function () {
      stop();

      var results = new Array(filesToFetch.length);
      var count = 0;
      var fetchError = null;
      for (var i = 0; i < filesToFetch.length; i++) {
         fetchFile(i, filesToFetch[i], function (index, err, file) {

            fetchError = fetchError || err;
            results[index] = file;
            count++;

            if (count === filesToFetch.length) {

               start();
               if(err) {
                  ok(false, err);
                  return;
               }
               if(simpleForm) {
                  testFunction.call(this, results[0]);
               } else {
                  testFunction.call(this, results);
               }
            }

         });
      }
   });
}




test("JSZip", function(){
   ok(JSZip, "JSZip exists");

   var zip = new JSZip();
   ok(zip instanceof JSZip, "Constructor works");

   var zipNoNew = JSZip(); // jshint ignore:line
   ok(zipNoNew instanceof JSZip, "Constructor adds `new` before itself where necessary");
});

QUnit.module("Essential"); // {{{

test("JSZip.utils.transformTo", function () {
   var supportedArgs = ['string', 'array'];
   if (JSZip.support.arraybuffer) {
      supportedArgs.push("arraybuffer");
   }
   if (JSZip.support.uint8array) {
      supportedArgs.push("uint8array");
   }
   if (JSZip.support.nodebuffer) {
      supportedArgs.push("nodebuffer");
   }

   var txt = 'test text !';

   for (var i = 0; i < supportedArgs.length; i++) {
      for (var j = 0; j < supportedArgs.length; j++) {
         var step1 = JSZip.utils.transformTo(supportedArgs[i], txt);
         var step2 = JSZip.utils.transformTo(supportedArgs[j], step1);
         var result = JSZip.utils.transformTo("string", step2);
         equal(result, txt, "The transformation string -> " + supportedArgs[i] + " -> " + supportedArgs[j] + " -> string works");
      }
   }
});

testZipFile("Zip text file !", "ref/text.zip", function(expected) {
   stop();
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   checkBasicStreamBehavior(zip.generateInternalStream({type:"binarystring"}));
   zip.generateAsync({type:"binarystring"}).then(function (actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

testZipFile("Add a file to overwrite", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "hello ?");
   zip.file("Hello.txt", "Hello World\n");

   stop();
   zip.generateAsync({type:"binarystring"}).then(function (actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

// zip -X -0 utf8.zip amount.txt
testZipFile("Zip text file with UTF-8 characters", "ref/utf8.zip", function(expected) {
   var zip = new JSZip();
   zip.file("amount.txt", "€15\n");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function (actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

test("Text file with long unicode string", function() {
   var expected = "€";
   for(var i = 0; i < 13; i++) {
      expected = expected + expected;
   }
   var zip = new JSZip();
   zip.file("amount.txt", expected);
   stop();
   zip.generateAsync({type:"binarystring"})
   .then(function (zipContent) {
      var file = new JSZip(zipContent).file("amount.txt");
      return file.async("string");
   }).then(function (fileContent){
      equal(fileContent, expected, "Generated ZIP can be parsed");
      start();
   })['catch'](assertNoError);
});

// zip -X -0 utf8_in_name.zip €15.txt
testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(expected) {
   var zip = new JSZip();
   zip.file("€15.txt", "€15\n");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function (actual) {
      // zip doesn't generate a strange file like us (utf8 flag AND unicode path extra field)
      // if one of the files has more data than the other, the bytes are no more aligned and the
      // error count goes through the roof. The parsing is checked on a other test so I'll
      // comment this one for now.
      // ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

// zip --entry-comments --archive-comment -X -0 pile_of_poo.zip Iñtërnâtiônàlizætiøn☃$'\360\237\222\251'.txt
testZipFile("Zip text file and UTF-8, Pile Of Poo test", "ref/pile_of_poo.zip", function(expected) {
   var zip = new JSZip();
   // this is the string "Iñtërnâtiônàlizætiøn☃💩",
   // see http://mathiasbynens.be/notes/javascript-unicode
   // but escaped, to avoid troubles
   // thanks http://mothereff.in/js-escapes#1I%C3%B1t%C3%ABrn%C3%A2ti%C3%B4n%C3%A0liz%C3%A6ti%C3%B8n%E2%98%83%F0%9F%92%A9
   var text = 'I\xF1t\xEBrn\xE2ti\xF4n\xE0liz\xE6ti\xF8n\u2603\uD83D\uDCA9';
   zip.file(text + ".txt", text, {comment : text});
   stop();
   zip.generateAsync({type:"binarystring", comment : text}).then(function(actual) {

      checkGenerateStability(actual);

      var zipExpected = new JSZip(expected);
      var zipActual = new JSZip(actual);

      var fileExpected = zipExpected.file(text + ".txt");
      var fileActual = zipActual.file(text + ".txt");

      ok(fileExpected, "JSZip finds the unicode file name on the external file");
      ok(fileActual, "JSZip finds the unicode file name on its own file");

      stop();
      fileExpected.async("string").then(function (content) {
         equal(content, text, "JSZip can decode the external file");
         start();
      })['catch'](assertNoError);
      stop();
      fileActual.async("string").then(function (content) {
         equal(content, text, "JSZip can decode its own file");
         start();
      })['catch'](assertNoError);

      equal(fileExpected.comment, text, "JSZip can decode the external file comment");
      equal(fileActual.comment, text, "JSZip can decode its own file comment");

      equal(zipExpected.comment, text, "JSZip can decode the external zip comment");
      equal(zipActual.comment, text, "JSZip can decode its own zip comment");

      start();
   })['catch'](assertNoError);
});

testZipFile("Zip text file with date", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n", {date : new Date("July 17, 2009 14:36:57")});
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      /*
         Expected differing bytes:
         2  version number
         4  central dir version numbers
         4  external file attributes

         10 Total
         */
      ok(similar(actual, expected, 10) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});


testZipFile("Zip image file", "ref/image.zip", function(expected) {
   var zip = new JSZip();
   zip.file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

test("Zip folder() shouldn't throw an exception", function() {
   var zip = new JSZip();
   try {
      zip.folder();
      ok(true, "no exception thrown");
   } catch (e) {
      ok(false, e.message||e);
   }
});

testZipFile("Zip empty folder", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("folder");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

testZipFile("Zip text, folder and image", "ref/all.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

test("Folders are not created by default", function() {
   var zip = new JSZip();
   zip.file("test/Readme", "Hello World!\n");
   ok(zip.files["test/Readme"], "the file exists");
   ok(!zip.files["test/"], "the folder doesn't exist");
});

test("Folders can be created with createFolders", function() {
   var zip = new JSZip();
   zip.file("test/Readme", "Hello World!\n", {createFolders: true});
   ok(zip.files["test/Readme"], "the file exists");
   ok(zip.files["test/"], "the folder exists");
});

test("Finding a file", function() {
   var zip = new JSZip();
   zip.file("Readme", "Hello World!\n");
   zip.file("Readme.French", "Bonjour tout le monde!\n");
   zip.file("Readme.Pirate", "Ahoy m'hearty!\n");

   stop();
   zip.file("Readme.French").async("string").then(function (content) {
      equal(content, "Bonjour tout le monde!\n", "Exact match found");
      start();
   })['catch'](assertNoError);
   equal(zip.file("Readme.Deutch"), null, "Match exactly nothing");
   equal(zip.file(/Readme\../).length, 2, "Match regex free text");
   equal(zip.file(/pirate/i).length, 1, "Match regex 1 result");
});

testZipFile("Finding a file : modifying the result doesn't alter the zip", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.file("Hello.txt").name = "Hello2.txt";
   zip.file("Hello.txt").dir = true;
   // these changes won't be used
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

test("Finding a file (text search) with a relative folder", function() {
   var zip = new JSZip();
   zip.folder("files/default").file("Readme", "Hello World!\n");
   zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
   zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

   stop();
   zip.file("files/translation/Readme.French").async("string").then(function (content) {
      equal(content, "Bonjour tout le monde!\n", "finding file with the full path");
      start();
   })['catch'](assertNoError);
   stop();
   zip.folder("files").file("translation/Readme.French").async("string").then(function (content) {
      equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
      start();
   })['catch'](assertNoError);
   stop();
   zip.folder("files/translation").file("Readme.French").async("string").then(function (content) {
      equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
      start();
   })['catch'](assertNoError);
});

test("Finding files (regex) with a relative folder", function() {
   var zip = new JSZip();
   zip.folder("files/default").file("Readme", "Hello World!\n");
   zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
   zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

   equal(zip.file(/Readme/).length, 3, "match files in subfolders");
   equal(zip.folder("files/translation").file(/Readme/).length, 2, "regex match only in subfolders");
   equal(zip.folder("files").folder("translation").file(/Readme/).length, 2, "regex match only in subfolders");
   equal(zip.folder("files/translation").file(/pirate/i).length, 1, "regex match only in subfolders");
   equal(zip.folder("files/translation").file(/^readme/i).length, 2, "regex match only with the relative path");
   equal(zip.folder("files/default").file(/pirate/i).length, 0, "regex match only in subfolders");
});

test("Finding folders", function () {
   var zip = new JSZip();
   zip.folder("root/").folder("sub1/");
   zip.folder("root/sub2/subsub1");

   equal(zip.folder(/sub2\/$/).length, 0, "unique result");
   equal(zip.folder(/sub1/).length, 2, "multiple results");
   equal(zip.folder(/root/).length, 3, "match on whole path");
});

test("Finding folders with relative path", function () {
   var zip = new JSZip();
   zip.folder("root/").folder("sub1/");
   zip.folder("root/sub2/subsub1");
   var root = zip.folder("root/sub2");

   equal(root.folder(/sub2\/$/).length, 0, "current folder is not matched");
   equal(root.folder(/sub1/).length, 1, "sub folder is matched");
   equal(root.folder(/^subsub1/).length, 1, "relative folder path is used");
   equal(root.folder(/root/).length, 0, "parent folder is not matched");
});

function zipObjectsAssertions(zipObject) {
   var date = new Date("July 17, 2009 14:36:57");

   equal(zipObject.name, "Hello.txt", "ZipObject#name is here");

   equal(zipObject.comment, "my comment", "ZipObject#comment is here");

   // the zip date has a 2s resolution
   var delta = Math.abs(zipObject.date.getTime() - date.getTime());
   ok(delta < 2000/* ms */, date, "ZipObject#date is here");
   var deltaOptions = Math.abs(zipObject.options.date.getTime() - date.getTime());
   ok(deltaOptions < 2000/* ms */, date, "ZipObject#options.date is here (deprecated API)");
}
test("ZipObject attributes", function () {
   var date = new Date("July 17, 2009 14:36:57");
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n", {comment:"my comment", date:date});
   zipObjectsAssertions(zip.file("Hello.txt"));
   zipObjectsAssertions(zip.files["Hello.txt"]);
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      var reloaded = new JSZip(actual);
      zipObjectsAssertions(reloaded.file("Hello.txt"));
      zipObjectsAssertions(reloaded.files["Hello.txt"]);
      start();
   })['catch'](assertNoError);
});
test("generate uses updated ZipObject date attribute", function () {
   var date = new Date("July 17, 2009 14:36:57");
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n", {comment:"my comment"}); // date = now
   zip.files["Hello.txt"].date = date;
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      var reloaded = new JSZip(actual);
      zipObjectsAssertions(reloaded.file("Hello.txt"));
      zipObjectsAssertions(reloaded.files["Hello.txt"]);
      start();
   })['catch'](assertNoError);
});
test("generate uses updated ZipObject options.date attribute (deprecated)", function () {
   var date = new Date("July 17, 2009 14:36:57");
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n", {comment:"my comment"}); // date = now
   zip.files["Hello.txt"].options.date = date;
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      var reloaded = new JSZip(actual);
      zipObjectsAssertions(reloaded.file("Hello.txt"));
      zipObjectsAssertions(reloaded.files["Hello.txt"]);
      start();
   })['catch'](assertNoError);
});

// }}} module Essential

QUnit.module("More advanced"); // {{{

testZipFile("Delete file", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Remove.txt", "This file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("Remove.txt");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete file in folder", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("folder").file("Remove.txt", "This folder and file should be deleted\n");
   zip.remove("folder/Remove.txt");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete file in folder, with a relative path", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   var folder = zip.folder("folder");
   folder.file("Remove.txt", "This folder and file should be deleted\n");
   folder.remove("Remove.txt");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete folder", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete folder with a final /", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove/");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete unknown path", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("unknown_file");
   zip.remove("unknown_folder/Hello.txt");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete nested folders", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.folder("remove/second").file("Sub.txt", "This should be removed");
   zip.file("remove/second/another.txt", "Another file");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});

testZipFile("Delete nested folders from relative path", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("folder");
   zip.folder("folder/1/2/3");
   zip.folder("folder").remove("1");
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

testZipFile("add file: from XHR (with bytes > 255)", "ref/text.zip", function(textZip) {
   var zip = new JSZip();
   zip.file("text.zip", textZip, {binary:true});
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      // high-order byte is discarded and won't mess up the result
      checkGenerateStability(actual);
      start();
   })['catch'](assertNoError);
});

function testFileDataGetters (opts) {
   if (typeof opts.rawData === "undefined") {
      opts.rawData = opts.textData;
   }
   _actualTestFileDataGetters.testGetter(opts, "string");
   _actualTestFileDataGetters.testGetter(opts, "binarystring");
   _actualTestFileDataGetters.testGetter(opts, "arraybuffer");
   _actualTestFileDataGetters.testGetter(opts, "uint8array");
   _actualTestFileDataGetters.testGetter(opts, "nodebuffer");
   _actualTestFileDataGetters.testGetter(opts, "unknown");

   stop();
   opts.zip.generateAsync({type:"binarystring"}).then(function(result) {
      var reloaded = {
         name : "(reloaded) " + opts.name,
         // no check of crc32, we want to test the CompressedObject code.
         zip : new JSZip(result, {checkCRC32:false}),
         textData : opts.textData,
         rawData : opts.rawData
      };
      _actualTestFileDataGetters.testGetter(reloaded, "string");
      _actualTestFileDataGetters.testGetter(reloaded, "binarystring");
      _actualTestFileDataGetters.testGetter(reloaded, "arraybuffer");
      _actualTestFileDataGetters.testGetter(reloaded, "uint8array");
      _actualTestFileDataGetters.testGetter(reloaded, "nodebuffer");
      _actualTestFileDataGetters.testGetter(reloaded, "unknown");

      opts.zip.file("file.txt", "changing the content after the call won't change the result");
      start();
   })['catch'](assertNoError);

   opts.zip.file("file.txt", "changing the content after the call won't change the result");
}

var _actualTestFileDataGetters = {
   testGetter : function (opts, askedType) {
      var asyncTestName = "[test = " + opts.name + "] [method = async(" + askedType + ")] ";

      var err = null, content = null;

      var stream = opts.zip.file("file.txt").internalStream(askedType);
      checkBasicStreamBehavior(stream, asyncTestName);

      opts.zip.file("file.txt").async(askedType).then(function(result) {
         _actualTestFileDataGetters["assert_" + askedType](opts, null, result, asyncTestName);
      }, function (err) {
         _actualTestFileDataGetters["assert_" + askedType](opts, err, null, asyncTestName);
      });
   },
   assert_string: function (opts, err, txt, testName) {
      equal(err, null, testName + "no error");
      equal(txt, opts.textData, testName + "content ok");
   },
   assert_binarystring : function (opts, err, bin, testName) {
      equal(err, null, testName + "no error");
      equal(bin, opts.rawData, testName + "content ok");
   },
   assert_arraybuffer : function (opts, err, buffer, testName) {
      if (JSZip.support.arraybuffer) {
         equal(err, null, testName + "no error");
         ok(buffer instanceof ArrayBuffer, testName + "the result is a instance of ArrayBuffer");
         var actual = JSZip.utils.transformTo("string", buffer);
         equal(actual, opts.rawData, testName + "content ok");
      } else {
         equal(buffer, null, testName + "no data");
         ok(err.message.match("not supported by this browser"), testName + "the error message is useful");
      }
   },
   assert_uint8array : function (opts, err, bufferView, testName) {
      if (JSZip.support.uint8array) {
         equal(err, null, testName + "no error");
         ok(bufferView instanceof Uint8Array, testName+ "the result is a instance of Uint8Array");
         var actual = JSZip.utils.transformTo("string", bufferView);
         equal(actual, opts.rawData, testName + "content ok");
      } else {
         equal(bufferView, null, testName + "no data");
         ok(err.message.match("not supported by this browser"), testName + "the error message is useful");
      }
   },
   assert_nodebuffer : function (opts, err, buffer, testName) {
      if (JSZip.support.nodebuffer) {
         equal(err, null, testName + "no error");
         ok(buffer instanceof Buffer, testName + "the result is a instance of Buffer");
         var actual = JSZip.utils.transformTo("string", buffer);
         equal(actual, opts.rawData, testName + "content ok");
      } else {
         equal(buffer, null, testName + "no data");
         ok(err.message.match("not supported by this browser"), testName + "the error message is useful");
      }
   },
   assert_unknown : function (opts, err, buffer, testName) {
      equal(buffer, null, testName + "no data");
      ok(err.message.match("not supported by this browser"), testName + "the error message is useful");
      console.error(err);
   }
};

test("add file: file(name, undefined)", function() {
   var zip = new JSZip(), undef;
   zip.file("file.txt", undef);
   testFileDataGetters({name : "undefined", zip : zip, textData : ""});

   zip = new JSZip();
   zip.file("file.txt", undef, {binary:true});
   testFileDataGetters({name : "undefined as binary", zip : zip, textData : ""});

   zip = new JSZip();
   zip.file("file.txt", undef, {base64:true});
   testFileDataGetters({name : "undefined as base64", zip : zip, textData : ""});
});

test("add file: file(name, null)", function() {
   var zip = new JSZip();
   zip.file("file.txt", null);
   testFileDataGetters({name : "null", zip : zip, textData : ""});

   zip = new JSZip();
   zip.file("file.txt", null, {binary:true});
   testFileDataGetters({name : "null as binary", zip : zip, textData : ""});

   zip = new JSZip();
   zip.file("file.txt", null, {base64:true});
   testFileDataGetters({name : "null as base64", zip : zip, textData : ""});
});

test("add file: file(name, stringAsText)", function() {
   var zip = new JSZip();
   zip.file("file.txt", "€15\n", {binary:false});
   testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

   zip = new JSZip();
   zip.file("file.txt", "test\r\ntest\r\n", {binary:false});
   testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
});

test("add file: file(name, stringAsBinary)", function() {
   var zip = new JSZip();
   zip.file("file.txt", "\xE2\x82\xAC15\n", {binary:true});
   testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

   zip = new JSZip();
   zip.file("file.txt", "test\r\ntest\r\n", {binary:true});
   testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
});

test("add file: file(name, base64)", function() {
   var zip = new JSZip();
   zip.file("file.txt", "4oKsMTUK", {base64:true});
   testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

   zip = new JSZip();
   zip.file("file.txt", "dGVzdA0KdGVzdA0K", {base64:true});
   testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
});

test("add file: file(name, unsupported)", function() {
   var zip = new JSZip();
   try {
      zip.file("test.txt", new Date());
      ok(false, "An unsupported object was added, but no exception thrown");
   } catch(e) {
      ok(e.message.match("unsupported format"), "the error message is useful");
   }
});

if (JSZip.support.uint8array) {
   test("add file: file(name, Uint8Array)", function() {
      var str2array = function (str) {
         var array = new Uint8Array(str.length);
         for(var i = 0; i < str.length; i++) {
            array[i] = str.charCodeAt(i);
         }
         return array;
      };
      var zip = new JSZip();
      zip.file("file.txt", str2array("\xE2\x82\xAC15\n"));
      testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

      zip = new JSZip();
      zip.file("file.txt", str2array("test\r\ntest\r\n"));
      testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

      zip = new JSZip();
      zip.file("file.txt", str2array(""));
      testFileDataGetters({name : "empty content", zip : zip, textData : ""});
   });
}

if (JSZip.support.arraybuffer) {
   test("add file: file(name, ArrayBuffer)", function() {
      var str2buffer = function (str) {
         var array = new Uint8Array(str.length);
         for(var i = 0; i < str.length; i++) {
            array[i] = str.charCodeAt(i);
         }
         return array.buffer;
      };
      var zip = new JSZip();
      zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
      testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

      zip = new JSZip();
      zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
      testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

      zip = new JSZip();
      zip.file("file.txt", str2buffer(""));
      testFileDataGetters({name : "empty content", zip : zip, textData : ""});
   });
}

if (JSZip.support.nodebuffer) {
   test("add file: file(name, Buffer)", function() {
      var str2buffer = function (str) {
         var array = new Buffer(str.length);
         for(var i = 0; i < str.length; i++) {
            array[i] = str.charCodeAt(i);
         }
         return array;
      };
      var zip = new JSZip();
      zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
      testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

      zip = new JSZip();
      zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
      testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

      zip = new JSZip();
      zip.file("file.txt", str2buffer(""));
      testFileDataGetters({name : "empty content", zip : zip, textData : ""});
   });
}

function createZipAll() {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
   return zip;
}
function testGenerate(options) {
   var zip = options.prepare();
   checkBasicStreamBehavior(zip.generateInternalStream(options.options));

   stop();
   var triggeredCallback = false;
   zip.generateAsync(options.options).then(function(result) {
      triggeredCallback = true;
      options.assertions(null, result);

      if (!options.skipReloadTest) {
         checkGenerateStability(result, options.options);
      }
      start();
   }, function (err) {
      triggeredCallback = true;
      options.assertions(err, null);
      start();
   });
   ok(!triggeredCallback, "the async callback is async");

   zip.file("Hello.txt", "updating the zip file after the call won't change the result");
}

testZipFile("STORE is the default method", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   stop();
   zip.generateAsync({type:"binarystring", compression:'STORE'}).then(function(content) {
      // no difference with the "Zip text file" test.
      ok(similar(content, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});


function testGenerateFor(testCases, fn) {
   while(testCases.length) {
      var testCase = testCases.shift();
      fn(testCase.name, testCase.file, testCase.streamFiles);
   }
}

testGenerateFor([{
   name : "no stream",
   file : "ref/all.zip",
   streamFiles : false
}, {
   name : "with stream",
   // zip -fd -0 -X -r all-stream.zip Hello.txt images/
   file : "ref/all-stream.zip",
   streamFiles : true
}], function(testName, file, streamFiles) {

   testZipFile("generate : base64:false. Deprecated, but it still works. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {base64:false, streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            ok(similar(result, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });

   testZipFile("generate : base64:true. Deprecated, but it still works. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         skipReloadTest : true,
         options : {base64:true,streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            var actual = JSZip.base64.decode(result);
            ok(similar(actual, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });

   testZipFile("generate : type:string. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {type:"binarystring",streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            ok(similar(result, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });
   testZipFile("generate : type:base64. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         skipReloadTest : true,
         options : {type:"base64",streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            var actual = JSZip.base64.decode(result);
            ok(similar(actual, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });

   testZipFile("generate : type:uint8array. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {type:"uint8array",streamFiles:streamFiles},
         assertions : function (err, result) {
            if (JSZip.support.uint8array) {
               equal(err, null, "no error");
               ok(result instanceof Uint8Array, "the result is a instance of Uint8Array");

               // var actual = JSZip.utils.transformTo("string", result);

               ok(similar(result, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            } else {
               equal(result, null, "no data");
               ok(err.message.match("not supported by this browser"), "the error message is useful");
            }
         }
      });
   });

   testZipFile("generate : type:arraybuffer. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {type:"arraybuffer",streamFiles:streamFiles},
         assertions : function (err, result) {
            if (JSZip.support.arraybuffer) {
               equal(err, null, "no error");
               ok(result instanceof ArrayBuffer, "the result is a instance of ArrayBuffer");

               ok(similar(result, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            } else {
               equal(result, null, "no data");
               ok(err.message.match("not supported by this browser"), "the error message is useful");
            }
         }
      });
   });


   testZipFile("generate : type:nodebuffer. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {type:"nodebuffer",streamFiles:streamFiles},
         assertions : function (err, result) {
            if (JSZip.support.nodebuffer) {
               equal(err, null, "no error");
               ok(result instanceof Buffer, "the result is a instance of ArrayBuffer");

               var actual = JSZip.utils.transformTo("string", result);

               ok(similar(actual, expected, 3 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            } else {
               equal(result, null, "no data");
               ok(err.message.match("not supported by this browser"), "the error message is useful");
            }
         }
      });
   });

   testZipFile("generate : type:blob. " + testName, file, function(expected) {
      testGenerate({
         prepare : createZipAll,
         options : {type:"blob",streamFiles:streamFiles},
         skipReloadTest : true,
         assertions : function (err, result) {
            if (JSZip.support.blob) {
               equal(err, null, "no error");
               ok(result instanceof Blob, "the result is a instance of Blob");
               equal(result.type, "application/zip", "the result has the rigth mime type");
               equal(result.size, expected.length, "the result has the right length");
            } else {
               equal(result, null, "no data");
               ok(err.message.match("not supported by this browser"), "the error message is useful");
            }
         }
      });
   });
});


testGenerateFor([{
   name : "no stream",
   // zip -0 -X store.zip Hello.txt
   file : "ref/store.zip",
   streamFiles : false
}, {
   name : "with stream",
   // zip -0 -X -fd store-stream.zip Hello.txt
   file : "ref/store-stream.zip",
   streamFiles : true
}], function(testName, file, streamFiles) {
   testZipFile("STORE doesn't compress, " + testName, file, function(expected) {
      testGenerate({
         prepare : function () {
            var zip = new JSZip();
            zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
            return zip;
         },
         options : {type:"binarystring", compression:"STORE",streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            ok(similar(result, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });
});

testGenerateFor([{
   name : "no stream",
   // zip -6 -X deflate.zip Hello.txt
   file : "ref/deflate.zip",
   streamFiles : false
}, {
   name : "with stream",
   // zip -6 -X -fd deflate-stream.zip Hello.txt
   file : "ref/deflate-stream.zip",
   streamFiles : true
}], function(testName, file, streamFiles) {
   testZipFile("DEFLATE compress, " + testName, file, function(expected) {
      testGenerate({
         prepare : function () {
            var zip = new JSZip();
            zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
            return zip;
         },
         options : {type:"binarystring", compression:"DEFLATE",streamFiles:streamFiles},
         assertions : function (err, result) {
            equal(err, null, "no error");
            ok(similar(result, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
         }
      });
   });
});


test("Filtering a zip", function() {
   var zip = new JSZip();
   zip.file("1.txt", "1\n");
   zip.file("2.txt", "2\n");
   zip.file("3.log", "3\n");
   var result = zip.filter(function (relativeFilename, file){
      return relativeFilename.indexOf(".txt") != -1;
   });
   equal(result.length, 2, "filter has filtered");
   ok(result[0].name.indexOf(".txt") != -1, "filter has filtered the good file");
   ok(result[1].name.indexOf(".txt") != -1, "filter has filtered the good file");
});

test("Filtering a zip from a relative path", function() {
   var zip = new JSZip();
   zip.file("foo/1.txt", "1\n");
   zip.file("foo/2.txt", "2\n");
   zip.file("foo/3.log", "3\n");
   zip.file("1.txt", "1\n");
   zip.file("2.txt", "2\n");
   zip.file("3.log", "3\n");

   var result = zip.folder("foo").filter(function (relativeFilename, file) {
      return relativeFilename.indexOf("3") != -1;
   });
   equal(result.length, 1, "filter has filtered");
   equal(result[0].name, "foo/3.log", "filter has filtered the good file");
});

test("Filtering a zip : the full path is still accessible", function() {
   var zip = new JSZip();
   zip.file("foo/1.txt", "1\n");
   zip.file("foo/2.txt", "2\n");
   zip.file("foo/3.log", "3\n");
   zip.file("1.txt", "1\n");
   zip.file("2.txt", "2\n");
   zip.file("3.log", "3\n");

   var result = zip.folder("foo").filter(function (relativeFilename, file) {
      return file.name.indexOf("3") != -1;
   });
   equal(result.length, 1, "the filter only match files/folders in the current folder");
   equal(result[0].name, "foo/3.log", "filter has filtered the good file");
});

testZipFile("Filtering a zip : the filter function can't alter the data", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.filter(function (relativeFilename, file) {
      file.name = "bye.txt";
      file.data = "good bye";
      file.dir = true;
   });
   stop();
   zip.generateAsync({type:"binarystring"}).then(function(actual) {
      ok(similar(actual, expected, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      start();
   })['catch'](assertNoError);
});


function testLazyDecompression(from, to) {
   stop();
   createZipAll().generateAsync({type:"binarystring", compression:from}).then(function(actual) {
      start();
      testGenerate({
         prepare : function () {
            // the zip object will contain compressed objects
            return new JSZip(actual);
         },
         skipReloadTest : true,
         options : {type:"binarystring", compression:to},
         assertions : function (err, result) {
            equal(err, null, from + " -> " + to + " : no error");
         }
      });
   })['catch'](assertNoError);
}
test("Lazy decompression works", function() {
   testLazyDecompression("STORE", "STORE");
   testLazyDecompression("DEFLATE", "STORE");
   testLazyDecompression("STORE", "DEFLATE");
   testLazyDecompression("DEFLATE", "DEFLATE");
});


// zip -0 -X empty.zip plop && zip -d empty.zip plop
testZipFile("empty zip", "ref/empty.zip", function(expected) {
   testGenerate({
      prepare : function () {
         var zip = new JSZip();
         return zip;
      },
      options : {type:"binarystring"},
      assertions : function (err, result) {
         equal(err, null, "no error");
         ok(similar(result, expected, 0 * MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
      }
   });
});

/*
test("Empty files / folders are not compressed", function() {
   var deflateCount = 0, emptyDeflateCount = 0;
   var oldDeflateCompress = JSZip.compressions.DEFLATE.compress;
   testGenerate({
      prepare : function () {

         JSZip.compressions.DEFLATE.compress = function (str) {
            deflateCount++;
            if (!str) {
               emptyDeflateCount++;
            }
            return str;
         };

         var zip = new JSZip();
         zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
         zip.folder("folder").file("empty", "");
         return zip;
      },
      options : {type:"binarystring", compression:"DEFLATE"},
      assertions : function (err, result) {
         equal(err, null, "no error");

         equal(deflateCount, 1, "the file has been compressed");
         equal(emptyDeflateCount, 0, "the file without content and the folder has not been compressed.");

         JSZip.compressions.DEFLATE.compress = oldDeflateCompress;
      }
   });
});
*/

test("unknown compression throws an exception", function () {
   testGenerate({
      prepare : createZipAll,
      options : {compression:'MAYBE'},
      assertions : function (err, result) {
         equal(result, null, "no data");
         ok(err.message.match("not a valid compression"), "the error message is useful");
      }
   });
});
// }}} More advanced

QUnit.module("Load file, not supported features"); // {{{

// zip -0 -X -e encrypted.zip Hello.txt
testZipFile("basic encryption", "ref/encrypted.zip", function(file) {
   try {
      var zip = new JSZip(file);
      ok(false, "Encryption is not supported, but no exception were thrown");
   } catch(e) {
      equal(e.message, "Encrypted zip are not supported", "the error message is useful");
   }
});
// }}} Load file, not supported features

QUnit.module("Load file, corrupted zip"); // {{{

testZipFile("bad compression method", "ref/invalid/compression.zip", function(file) {
   try {
      var zip = new JSZip(file);
      ok(false, "no exception were thrown");
   } catch(e) {
      ok(e.message.match("Corrupted zip"), "the error message is useful");
   }
});

test("not a zip file", function() {
   try {
      var zip = new JSZip("this is not a zip file", {checkCRC32:false});
      ok(false, "no exception were thrown");
   } catch(e) {
      ok(e.message.match("Corrupted zip"), "the error message is useful");
   }
});

testZipFile("invalid crc32 but no check", "ref/invalid/crc32.zip", function(file) {
   try {
      var zip = new JSZip(file, {checkCRC32:false});
      ok(true, "no exception were thrown");
   } catch(e) {
      ok(false, "An exception were thrown but the check should have been disabled.");
   }
});

testZipFile("invalid crc32", "ref/invalid/crc32.zip", function(file) {
   try {
      var zip = new JSZip(file, {checkCRC32:true});
      ok(false, "no exception were thrown");
   } catch(e) {
      ok(e.message.match("Corrupted zip"), "the error message is useful");
   }
});

testZipFile("bad offset", "ref/invalid/bad_offset.zip", function(file) {
   try {
      var zip = new JSZip(file);
      ok(false, "no exception were thrown");
   } catch(e) {
      ok(e.message.match("Corrupted zip"), "the error message is useful");
   }
});

testZipFile("bad decompressed size", "ref/invalid/bad_decompressed_size.zip", function(file) {
   var zip = new JSZip(file);

   stop();
   zip.file("Hello.txt").async("string").then(function (result) {
      ok(false, "successful result in an error test");
      start();
   }, function (err) {
      ok(err.message.match("size mismatch"), "async call : the error message is useful");
      start();
   });
});
// }}} Load file, corrupted zip

QUnit.module("Load file"); // {{{

testZipFile("load(string) works", "ref/all.zip", function(file) {
   ok(typeof file === "string");
   var zip = new JSZip(file);
   stop();
   zip.file("Hello.txt").async("string").then(function(result) {
      equal(result, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

testZipFile("load(string) handles bytes > 255", "ref/all.zip", function(file) {
   // the method used to load zip with ajax will remove the extra bits.
   // adding extra bits :)
   var updatedFile = "";
   for (var i = 0; i < file.length; i++) {
      updatedFile += String.fromCharCode((file.charCodeAt(i) & 0xff) + 0x4200);
   }
   var zip = new JSZip(updatedFile);

   stop();
   zip.file("Hello.txt").async("string").then(function (content) {
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

if (JSZip.support.arraybuffer) {
   testZipFile("load(ArrayBuffer) works", "ref/all.zip", function(fileAsString) {
      var file = new ArrayBuffer(fileAsString.length);
      var bufferView = new Uint8Array(file);
      for( var i = 0; i < fileAsString.length; ++i ) {
         bufferView[i] = fileAsString.charCodeAt(i);
      }

      ok(file instanceof ArrayBuffer);

      // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
      // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
      stop();
      new JSZip(file).file("Hello.txt").async("arraybuffer").then(function (content){
         equal(content.byteLength, 12, "don't get the original buffer");
         start();
      })['catch'](assertNoError);

      stop();
      new JSZip(file).file("Hello.txt").async("uint8array").then(function (content){
         equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
         start();
      });

      stop();
      new JSZip(file).file("Hello.txt").async("string").then(function (content){
         equal(content, "Hello World\n", "the zip was correctly read.");
         start();
      });
   });
}

if (JSZip.support.nodebuffer) {
   testZipFile("load(Buffer) works", "ref/all.zip", function(fileAsString) {
      var file = new Buffer(fileAsString.length);
      for( var i = 0; i < fileAsString.length; ++i ) {
         file[i] = fileAsString.charCodeAt(i);
      }

      stop();
      new JSZip(file).file("Hello.txt").async("string").then(function (content){
         equal(content, "Hello World\n", "the zip was correctly read.");
         start();
      });
   });
}

if (JSZip.support.uint8array) {
   testZipFile("load(Uint8Array) works", "ref/all.zip", function(fileAsString) {
      var file = new Uint8Array(fileAsString.length);
      for( var i = 0; i < fileAsString.length; ++i ) {
         file[i] = fileAsString.charCodeAt(i);
      }

      ok(file instanceof Uint8Array);

      // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
      // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
      stop();
      new JSZip(file).file("Hello.txt").async("arraybuffer").then(function (content){
         equal(content.byteLength, 12, "don't get the original buffer");
         start();
      })['catch'](assertNoError);

      stop();
      new JSZip(file).file("Hello.txt").async("uint8array").then(function (content){
         equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
         start();
      })['catch'](assertNoError);

      stop();
      new JSZip(file).file("Hello.txt").async("string").then(function (content){
         equal(content, "Hello World\n", "the zip was correctly read.");
         start();
      })['catch'](assertNoError);
   });
}

// zip -6 -X deflate.zip Hello.txt
testZipFile("zip with DEFLATE", "ref/deflate.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   new JSZip(file).file("Hello.txt").async("string").then(function (content){
      equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// zip -0 -X -z -c archive_comment.zip Hello.txt
testZipFile("read zip with comment", "ref/archive_comment.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.comment, "file comment", "the archive comment was correctly read.");
   equal(zip.file("Hello.txt").comment, "entry comment", "the entry comment was correctly read.");
   stop();
   new JSZip(file).file("Hello.txt").async("string").then(function (content){
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});
testZipFile("generate zip with comment", "ref/archive_comment.zip", function(file) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n", {comment:"entry comment"});
   stop();
   zip.generateAsync({type:"binarystring", comment:"file comment"}).then(function(generated) {
      ok(similar(generated, file, MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
      checkGenerateStability(generated);
      start();
   })['catch'](assertNoError);
});

// zip -0 extra_attributes.zip Hello.txt
testZipFile("zip with extra attributes", "ref/extra_attributes.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.file("Hello.txt").async("string").then(function (content) {
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// use -fz to force use of Zip64 format
// zip -fz -0 zip64.zip Hello.txt
testZipFile("zip 64", "ref/zip64.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   new JSZip(file).file("Hello.txt").async("string").then(function (content){
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// use -fd to force data descriptors as if streaming
// zip -fd -0 data_descriptor.zip Hello.txt
testZipFile("zip with data descriptor", "ref/data_descriptor.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   new JSZip(file).file("Hello.txt").async("string").then(function (content){
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// combo of zip64 and data descriptors :
// zip -fz -fd -0 data_descriptor_zip64.zip Hello.txt
// this generate a corrupted zip file :(
// TODO : find how to get the two features

// zip -0 -X zip_within_zip.zip Hello.txt && zip -0 -X nested.zip Hello.txt zip_within_zip.zip
testZipFile("nested zip", "ref/nested.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.file("zip_within_zip.zip").async("binarystring").then(function (innerZip){
      return new JSZip(innerZip).file("Hello.txt").async("string");
   }).then(function (content) {
      equal(content, "Hello World\n", "the inner zip was correctly read.");
      start();
   })['catch'](assertNoError);
   stop();
   zip.file("Hello.txt").async("string").then(function (content) {
      equal(content, "Hello World\n", "the zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// zip -fd -0 nested_data_descriptor.zip data_descriptor.zip
testZipFile("nested zip with data descriptors", "ref/nested_data_descriptor.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.file("data_descriptor.zip").async("binarystring").then(function (innerZip){
      return new JSZip(innerZip).file("Hello.txt").async("string");
   }).then(function (content) {
      equal(content, "Hello World\n", "the inner zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// zip -fz -0 nested_zip64.zip zip64.zip
testZipFile("nested zip 64", "ref/nested_zip64.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.file("zip64.zip").async("binarystring").then(function (innerZip64){
      return new JSZip(innerZip64).file("Hello.txt").async("string");
   }).then(function (content) {
      equal(content, "Hello World\n", "the inner zip was correctly read.");
      start();
   })['catch'](assertNoError);
});

// nested zip 64 with data descriptors
// zip -fz -fd -0 nested_data_descriptor_zip64.zip data_descriptor_zip64.zip
// this generate a corrupted zip file :(
// TODO : find how to get the two features

// zip -X -0 utf8_in_name.zip €15.txt
testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(file) {
   var zip = new JSZip(file);
   ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
   stop();
   zip.file("€15.txt").async("string").then(function (content) {
      equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
      start();
   })['catch'](assertNoError);
   stop();
   zip.files["€15.txt"].async("string").then(function (content) {
      equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
      start();
   })['catch'](assertNoError);
});

// Created with winrar
// winrar will replace the euro symbol with a '_' but set the correct unicode path in an extra field.
testZipFile("Zip text file with UTF-8 characters in filename and windows compatibility", "ref/winrar_utf8_in_name.zip", function(file) {
   var zip = new JSZip(file);
   ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
   stop();
   zip.file("€15.txt").async("string").then(function (content) {
      equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
      start();
   })['catch'](assertNoError);
   stop();
   zip.files["€15.txt"].async("string").then(function (content) {
      equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
      start();
   })['catch'](assertNoError);
});

// zip backslash.zip -0 -X Hel\\lo.txt
testZipFile("Zip text file with backslash in filename", "ref/backslash.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.file("Hel\\lo.txt").async("string").then(function (content) {
      equal(content, "Hello World\n", "the utf8 content was correctly read.");
      start();
   });
});

// use izarc to generate a zip file on windows
testZipFile("Zip text file from windows with \\ in central dir", "ref/slashes_and_izarc.zip", function(file) {
   var zip = new JSZip(file);
   stop();
   zip.folder("test").file("Hello.txt").async("string").then(function (content) {
      equal(content, "Hello world\r\n", "the content was correctly read.");
      start();
   })['catch'](assertNoError);
});

test("A folder stays a folder", function () {
   testGenerate({
      prepare : function () {
         var zip = new JSZip();
         zip.folder("folder/");
         ok(zip.files['folder/'].dir, "the folder is marked as a folder");
         ok(zip.files['folder/'].options.dir, "the folder is marked as a folder, deprecated API");
         return zip;
      },
      options : {type:"binarystring"},
      assertions : function (err, result) {
         equal(err, null, "no error");
         var reloaded = new JSZip(result);
         ok(reloaded.files['folder/'].dir, "the folder is marked as a folder");
         ok(reloaded.files['folder/'].options.dir, "the folder is marked as a folder, deprecated API");
      }
   });
});

test("A stream is pausable", function () {
   // let's get a stream that generates a lot of chunks
   var zip = new JSZip();
   var txt = "a text";
   for(var i = 0; i < 10; i++) {
      zip.file(i + ".txt", txt);
   }

   var allowChunks = true;
   var chunkCount = 0;

   var helper = zip.generateInternalStream({streamFiles:true, type:"binarystring"});
   helper
   .on("data", function () {
      chunkCount++;
      equal(allowChunks, true, "be sure to get chunks only when allowed");
   })
   .on("error", function (e) {
      start();
      ok(false, e.message);
   })
   .on("end", function () {
      start();
   });
   stop();
   helper.resume();
   setTimeout(function () {
      allowChunks = false;
      ok(chunkCount > 0, "the stream emitted at least 1 chunk before pausing it");
      helper.pause();
   }, 10);
   setTimeout(function () {
      allowChunks = true;
      helper.resume();
   }, 40);


});

// }}} Load file

QUnit.module("Load complex files"); // {{{

if (QUnit.urlParams.complexfiles) {

   // http://www.feedbooks.com/book/8/the-metamorphosis
   testZipFile("Franz Kafka - The Metamorphosis.epub", "ref/complex_files/Franz Kafka - The Metamorphosis.epub", function(file) {
      var zip = new JSZip(file);
      equal(zip.filter(function(){return true;}).length, 26, "the zip contains the good number of elements.");
      stop();
      zip.file("mimetype").async("string").then(function (content) {
         equal(content, "application/epub+zip\r\n", "the zip was correctly read.");
         start();
      })['catch'](assertNoError);

      stop();
      zip.file("OPS/main0.xml").async("string").then(function (content) {
         // the .ncx file tells us that the first chapter is in the main0.xml file.
         ok(content.indexOf("One morning, as Gregor Samsa was waking up from anxious dreams") !== -1, "the zip was correctly read.");
         start();
      })['catch'](assertNoError);
   });

   // a showcase in http://msdn.microsoft.com/en-us/windows/hardware/gg463429
   testZipFile("Outlook2007_Calendar.xps", "ref/complex_files/Outlook2007_Calendar.xps", function(file) {
      var zip = new JSZip(file);
      // the zip file contains 15 entries.
      equal(zip.filter(function(){return true;}).length, 15, "the zip contains the good number of elements.");
      stop();
      zip.file("[Content_Types].xml").async("string").then(function (content) {
         ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
         start();
      })['catch'](assertNoError);
   });

    // Same test as above, but with createFolders option set to true
    testZipFile("Outlook2007_Calendar.xps", "ref/complex_files/Outlook2007_Calendar.xps", function(file) {
        var zip = new JSZip(file, {createFolders: true});
        // the zip file contains 15 entries, but we get 23 when creating all the sub-folders.
        equal(zip.filter(function(){return true;}).length, 23, "the zip contains the good number of elements.");
        stop();
        zip.file("[Content_Types].xml").async("string").then(function (content) {
           ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
           start();
        })['catch'](assertNoError);
    });

   // an example file in http://cheeso.members.winisp.net/srcview.aspx?dir=js-unzip
   // the data come from http://www.antarctica.ac.uk/met/READER/upper_air/
   testZipFile("AntarcticaTemps.xlsx", "ref/complex_files/AntarcticaTemps.xlsx", function(file) {
      var zip = new JSZip(file);
      // the zip file contains 17 entries.
      equal(zip.filter(function(){return true;}).length, 17, "the zip contains the good number of elements.");
      stop();
      zip.file("[Content_Types].xml").async("string").then(function (content) {
         ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
         start();
      })['catch'](assertNoError);
   });

   // Same test as above, but with createFolders option set to true
   testZipFile("AntarcticaTemps.xlsx", "ref/complex_files/AntarcticaTemps.xlsx", function(file) {
       var zip = new JSZip(file, {createFolders: true});
       // the zip file contains 16 entries, but we get 27 when creating all the sub-folders.
       equal(zip.filter(function(){return true;}).length, 27, "the zip contains the good number of elements.");
       stop();
       zip.file("[Content_Types].xml").async("string").then(function (content) {
          ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
          start();
       })['catch'](assertNoError);
   });

   // same as two up, but in the Open Document format
   testZipFile("AntarcticaTemps.ods", "ref/complex_files/AntarcticaTemps.ods", function (file) {
       var zip = new JSZip(file);
       // the zip file contains 20 entries.
       equal(zip.filter(function () {return true;}).length, 20, "the zip contains the good number of elements.");
       stop();
       zip.file("META-INF/manifest.xml").async("string").then(function (content) {
          ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
          start();
       })['catch'](assertNoError);
   });

   // same as above, but in the Open Document format
   testZipFile("AntarcticaTemps.ods", "ref/complex_files/AntarcticaTemps.ods", function (file) {
       var zip = new JSZip(file, {createFolders: true});
       // the zip file contains 19 entries, but we get 27 when creating all the sub-folders.
       equal(zip.filter(function () {return true;}).length, 27, "the zip contains the good number of elements.");
       stop();
       zip.file("META-INF/manifest.xml").async("string").then(function (content) {
          ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
          start();
       })['catch'](assertNoError);
   });
}
// }}} Load complex files


// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
