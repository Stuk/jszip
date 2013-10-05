
function similar(actual, expected, mistakes) {
   // actual is the generated zip, expected is what we got from the xhr.
   // Be sure to have a well formatted string
   expected = JSZip.utils.string2binary(expected);

   if (actual.length !== expected.length) {
      mistakes -= Math.abs((actual.length||0) - (expected.length||0));
   }

   for (var i = 0; i < Math.min(actual.length, expected.length); i++) {
      if (actual.charAt(i) !== expected.charAt(i)) {
         mistakes--;
      }
   }

   if (mistakes < 0)
      return false;
   else
      return true;
}

/**
 * bytes -> JSZip -> bytes
 */
function reload(bytesStream) {
   return new JSZip(bytesStream, {checkCRC32:true}).generate({type:"string"});
}

// cache for files
var refZips = {};

function testZipFile(testName, zipName, testFunction) {
   test(testName, function () {
      if (refZips[zipName]) {
         testFunction.call(this, refZips[zipName]);
      } else {
         stop();
         JSZipTestUtils.loadZipFile(zipName, function (file) {
            start();
            refZips[zipName] = file;
            testFunction.call(this, file);
         }, function(error){
            if (QUnit.config.semaphore) {
               start();
            }
            ok(false, error);
         });
      }
   });
}




test("JSZip", function(){
   ok(JSZip, "JSZip exists");

   var zip = new JSZip();
   ok(zip, "Constructor works");
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
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   /*
      Expected differing bytes:
      2  version number
      4  date/time
      4  central dir version numbers
      4  central dir date/time
      4  external file attributes

      18 Total
      */
   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
});

testZipFile("Add a file to overwrite", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "hello ?");
   zip.file("Hello.txt", "Hello World\n");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   /*
      Expected differing bytes:
      2  version number
      4  date/time
      4  central dir version numbers
      4  central dir date/time
      4  external file attributes

      18 Total
      */
   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
   });

// zip -X -0 utf8.zip amount.txt
testZipFile("Zip text file with UTF-8 characters", "ref/utf8.zip", function(expected) {
      var zip = new JSZip();
      zip.file("amount.txt", "€15\n");
      var actual = zip.generate({type:"string"});

      ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
      equal(reload(actual), actual, "Generated ZIP can be parsed");
      });

// zip -X -0 utf8_in_name.zip €15.txt
testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(expected) {
      var zip = new JSZip();
      zip.file("€15.txt", "€15\n");
      var actual = zip.generate({type:"string"});

      ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
      equal(reload(actual), actual, "Generated ZIP can be parsed");
      });

testZipFile("Zip text file with date", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n", {date : new Date("July 17, 2009 14:36:57")});
      var content = zip.generate();

      var actual = JSZip.base64.decode(content);

      /*
         Expected differing bytes:
         2  version number
         4  central dir version numbers
         4  external file attributes

         10 Total
         */
      ok(similar(actual, expected, 10) , "Generated ZIP matches reference ZIP");
      equal(reload(actual), actual, "Generated ZIP can be parsed");
});


testZipFile("Zip image file", "ref/image.zip", function(expected) {
   var zip = new JSZip();
   zip.file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
});

test("Zip folder() shouldn't throw an exception", function(expected) {
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
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
});

testZipFile("Zip text, folder and image", "ref/all.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   /*
      Expected differing bytes:
      2  version number
      4  date/time
      4  central dir version numbers
      4  central dir date/time
      4  external file attributes

      18 * 3 files
      54 Total
      */

   ok(similar(actual, expected, 54) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
});

test("Finding a file", function() {
   var zip = new JSZip();
   zip.file("Readme", "Hello World!\n");
   zip.file("Readme.French", "Bonjour tout le monde!\n");
   zip.file("Readme.Pirate", "Ahoy m'hearty!\n");

   equal(zip.file("Readme.French").asText(), "Bonjour tout le monde!\n", "Exact match found");
   equal(zip.file("Readme.Deutch"), null, "Match exactly nothing");
   equal(zip.file(/Readme\../).length, 2, "Match regex free text");
   equal(zip.file(/pirate/i).length, 1, "Match regex 1 result");
});

testZipFile("Finding a file : modifying the result doesn't alter the zip", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.file("Hello.txt").name = "Hello2.txt";
   zip.file("Hello.txt").options.dir = true;
   // these changes won't be used
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

test("Finding a file (text search) with a relative folder", function() {
   var zip = new JSZip();
   zip.folder("files/default").file("Readme", "Hello World!\n");
   zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
   zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

   equal(zip.file("files/translation/Readme.French").asText(), "Bonjour tout le monde!\n", "finding file with the full path");
   equal(zip.folder("files").file("translation/Readme.French").asText(), "Bonjour tout le monde!\n", "finding file with a relative path");
   equal(zip.folder("files/translation").file("Readme.French").asText(), "Bonjour tout le monde!\n", "finding file with a relative path");
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

   equal(zip.folder(/sub2\/$/).length, 1, "unique result");
   equal(zip.folder(/sub1/).length, 2, "multiple results");
   equal(zip.folder(/root/).length, 4, "match on whole path");
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
// }}} module Essential

QUnit.module("More advanced"); // {{{

testZipFile("Delete file", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Remove.txt", "This file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("Remove.txt");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");

});

testZipFile("Delete file in folder", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("folder").file("Remove.txt", "This folder and file should be deleted\n");
   zip.remove("folder/Remove.txt");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("Delete file in folder, with a relative path", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   var folder = zip.folder("folder");
   folder.file("Remove.txt", "This folder and file should be deleted\n");
   folder.remove("Remove.txt");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("Delete folder", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("Delete folder with a final /", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove/");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("Delete unknown path", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("unknown_file");
   zip.remove("unknown_folder/Hello.txt");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("Delete nested folders", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
   zip.folder("remove/second").file("Sub.txt", "This should be removed");
   zip.file("remove/second/another.txt", "Another file");
   zip.file("Hello.txt", "Hello World\n");
   zip.remove("remove");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");

});

testZipFile("Delete nested folders from relative path", "ref/folder.zip", function(expected) {
   var zip = new JSZip();
   zip.folder("folder");
   zip.folder("folder/1/2/3");
   zip.folder("folder").remove("1");
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   equal(reload(actual), actual, "Generated ZIP can be parsed");
});

testZipFile("add file: from XHR (with bytes > 255)", "ref/text.zip", function(textZip) {
   var zip = new JSZip();
   zip.file("text.zip", textZip, {binary:true});
   var actual = zip.generate({base64:false});

   equal(reload(actual), actual, "high-order byte is discarded and won't mess up the result");
});

function testFileDataGetters (opts) {
   if (typeof opts.rawData === "undefined") {
      opts.rawData = opts.textData;
   }
   _actualTestFileDataGetters.asText(opts);
   _actualTestFileDataGetters.asBinary(opts);
   _actualTestFileDataGetters.asArrayBuffer(opts);
   _actualTestFileDataGetters.asUint8Array(opts);
   _actualTestFileDataGetters.asNodeBuffer(opts);

   var reload = function () {
      return {
         name : "reloaded, " + opts.name,
         // no check of crc32, we want to test the CompressedObject code.
         zip : new JSZip(opts.zip.generate({type:"string"}, {checkCRC32:false})),
         textData : opts.textData,
         rawData : opts.rawData
      };
   };

   _actualTestFileDataGetters.asText(reload());
   _actualTestFileDataGetters.asBinary(reload());
   _actualTestFileDataGetters.asArrayBuffer(reload());
   _actualTestFileDataGetters.asUint8Array(reload());
   _actualTestFileDataGetters.asNodeBuffer(reload());
}

var _actualTestFileDataGetters = {
   asText : function (opts) {
      equal(opts.zip.file("file.txt").asText(), opts.textData, opts.name + " : asText()");
   },
   asBinary : function (opts) {
      equal(opts.zip.file("file.txt").asBinary(), opts.rawData, opts.name + " : asBinary()");
   },
   asArrayBuffer : function (opts) {
      if (JSZip.support.arraybuffer) {
         var buffer = opts.zip.file("file.txt").asArrayBuffer();
         ok(buffer instanceof ArrayBuffer, opts.name + " : the result is a instance of ArrayBuffer");
         var actual = JSZip.utils.transformTo("string", buffer);
         equal(actual, opts.rawData, opts.name + " : asArrayBuffer()");
      } else {
         try {
            opts.zip.file("file.txt").asArrayBuffer();
            ok(false, "no exception thrown");
         } catch (e) {
            ok(e.message.match("not supported by this browser"), opts.name + " : the error message is useful");
         }
      }
   },
   asUint8Array : function (opts) {
      if (JSZip.support.uint8array) {
         var bufferView = opts.zip.file("file.txt").asUint8Array();
         ok(bufferView instanceof Uint8Array, opts.name + " : the result is a instance of Uint8Array");
         var actual = JSZip.utils.transformTo("string", bufferView);
         equal(actual, opts.rawData, opts.name + " : asUint8Array()");
      } else {
         try {
            opts.zip.file("file.txt").asUint8Array();
            ok(false, "no exception thrown");
         } catch (e) {
            ok(e.message.match("not supported by this browser"), opts.name + " : the error message is useful");
         }
      }
   },
   asNodeBuffer : function (opts) {
      if (JSZip.support.nodebuffer) {
         var buffer = opts.zip.file("file.txt").asNodeBuffer();
         ok(buffer instanceof Buffer, opts.name + " : the result is a instance of Buffer");
         var actual = JSZip.utils.transformTo("string", buffer);
         equal(actual, opts.rawData, opts.name + " : .asNodeBuffer()");
      } else {
         try {
            opts.zip.file("file.txt").asNodeBuffer();
            ok(false, "no exception thrown");
         } catch (e) {
            ok(e.message.match("not supported by this browser"), opts.name + " : the error message is useful");
         }
      }
   }
};

test("add file: file(name, undefined)", function() {
   var zip = new JSZip(), undef;
   zip.file("file.txt", undef);
   testFileDataGetters({name : "undefined", zip : zip, textData : ""});
   zip = new JSZip();
   zip.file("file.txt", undef, {binary:true});
   testFileDataGetters({name : "undefined", zip : zip, textData : ""});
   zip = new JSZip();
   zip.file("file.txt", undef, {base64:true});
   testFileDataGetters({name : "undefined", zip : zip, textData : ""});
});

test("add file: file(name, null)", function() {
   var zip = new JSZip();
   zip.file("file.txt", null);
   testFileDataGetters({name : "null", zip : zip, textData : ""});
   zip = new JSZip();
   zip.file("file.txt", null, {binary:true});
   testFileDataGetters({name : "null", zip : zip, textData : ""});
   zip = new JSZip();
   zip.file("file.txt", null, {base64:true});
   testFileDataGetters({name : "null", zip : zip, textData : ""});
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
   if (JSZip.support.blob) {
      var blob = zip.generate({type:"blob"});
      try {
         zip.file("test.txt", blob);
         ok(false, "An blob was added, but no exception thrown");
      } catch(e) {
         ok(e.message.match("unsupported format"), "the error message is useful");
      }
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

testZipFile("generate : base64:false. Deprecated, but it still works", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   var actual = zip.generate({base64:false});

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("generate : base64:true. Deprecated, but it still works", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   var content = zip.generate({base64:true});
   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("generate : type:string", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   var actual = zip.generate({type:"string"});

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

testZipFile("generate : type:base64", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
   var content = zip.generate({type:"base64"});

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

if (JSZip.support.uint8array) {
   testZipFile("generate : type:uint8array", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      var array = zip.generate({type:"uint8array"});
      ok(array instanceof Uint8Array, "The result is a instance of Uint8Array");
      equal(array.length, expected.length);

      var actual = JSZip.utils.transformTo("string", array);

      ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   });
} else {
   testZipFile("generate : type:uint8array", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      try {
         var blob = zip.generate({type:"uint8array"});
         ok(false, "Uint8Array is not supported, but no exception thrown");
      } catch(e) {
         ok(e.message.match("not supported by this browser"), "the error message is useful");
      }
   });
}

if (JSZip.support.arraybuffer) {
   testZipFile("generate : type:arraybuffer", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      var buffer = zip.generate({type:"arraybuffer"});
      ok(buffer instanceof ArrayBuffer, "The result is a instance of ArrayBuffer");

      var actual = JSZip.utils.transformTo("string", buffer);

      ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   });
} else {
   testZipFile("generate : type:arraybuffer", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      try {
         var blob = zip.generate({type:"arraybuffer"});
         ok(false, "ArrayBuffer is not supported, but no exception thrown");
      } catch(e) {
         ok(e.message.match("not supported by this browser"), "the error message is useful");
      }
   });
}

if (JSZip.support.nodebuffer) {
   testZipFile("generate : type:nodebuffer", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      var buffer = zip.generate({type:"nodebuffer"});
      ok(buffer instanceof Buffer, "The result is a instance of ArrayBuffer");

      var actual = "";
      for (var i = 0; i < buffer.length; i++) {
         actual += String.fromCharCode(buffer[i]);
      }

      ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
   });
} else {
   testZipFile("generate : type:nodebuffer", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      try {
         var blob = zip.generate({type:"nodebuffer"});
         ok(false, "Buffer is not supported, but no exception thrown");
      } catch(e) {
         ok(e.message.match("not supported by this browser"), "the error message is useful");
      }
   });
}

if (JSZip.support.blob) {
   testZipFile("generate : type:blob", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      var blob = zip.generate({type:"blob"});
      ok(blob instanceof Blob, "The result is a instance of Blob");
      equal(blob.type, "application/zip");
      equal(blob.size, expected.length);
   });
} else {
   testZipFile("generate : type:blob", "ref/text.zip", function(expected) {
      var zip = new JSZip();
      zip.file("Hello.txt", "Hello World\n");
      try {
         var blob = zip.generate({type:"blob"});
         ok(false, "Blob is not supported, but no exception thrown");
      } catch(e) {
         ok(e.message.match("not supported by this browser"), "the error message is useful");
      }
   });
}

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
      file.options.dir = true;
   });
   var content = zip.generate();

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");

});

testZipFile("STORE is the default method", "ref/text.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "Hello World\n");
      var content = zip.generate({compression:'STORE'});

   var actual = JSZip.base64.decode(content);

   // no difference with the "Zip text file" test.
   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

// zip -0 -X store.zip Hello.txt
testZipFile("STORE doesn't compress", "ref/store.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
   var content = zip.generate({compression:'STORE'});

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});

/*
// commented because the new implementation of DEFLATE produces different results from the old one.

// zip -6 -X deflate.zip Hello.txt
testZipFile("DEFLATE compress", "ref/deflate.zip", function(expected) {
   var zip = new JSZip();
   zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
   var content = zip.generate({compression:'DEFLATE'});

   var actual = JSZip.base64.decode(content);

   ok(similar(actual, expected, 18) , "Generated ZIP matches reference ZIP");
});
*/
test("Lazy decompression works", function () {
   var zip = new JSZip();
   zip.folder("test/").file("Hello.txt", "hello !");

   var expected = zip.generate({type:"string", compression:"STORE"});

   zip = new JSZip(expected); // lazy
   equal(zip.generate({type:"string", compression:"STORE"}), expected, "Reloading file, same compression");

   zip = new JSZip(zip.generate({type:"string", compression:"DEFLATE"}));
   zip = new JSZip(zip.generate({type:"string", compression:"STORE"}));

   var zipData = zip.generate({type:"string", compression:"STORE"});
   equal(zipData, expected, "Reloading file, different compression");

   // check CRC32
   new JSZip(zipData, {checkCRC32:true}).generate({type:"string"});
});

test("Empty files / folders are not compressed", function() {
   var zip = new JSZip();
   zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
   zip.folder("folder").file("empty", "");

   var deflateCount = 0, emptyDeflateCount = 0;
   var oldDeflateCompress = JSZip.compressions.DEFLATE.compress;
   JSZip.compressions.DEFLATE.compress = function (str) {
      deflateCount++;
      if (!str) {
         emptyDeflateCount++;
      }
      return str;
   };
   zip.generate({compression:'DEFLATE'});

   equal(deflateCount, 1, "The file has been compressed");
   equal(emptyDeflateCount, 0, "The file without content and the folder has not been compressed.");

   JSZip.compressions.DEFLATE.compress = oldDeflateCompress;
});

test("unknown compression throws an exception", function () {
   var zip = new JSZip().file("file.txt", "test");
   try {
      zip.generate({compression:'MAYBE'});
      ok(false, "no exception");
   } catch (e) {
      ok(true, "an exception were thrown");
   }
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
// }}} Load file, corrupted zip

QUnit.module("Load file"); // {{{

testZipFile("load(string) works", "ref/all.zip", function(file) {
   ok(typeof file === "string");
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
});

testZipFile("load(string) handles bytes > 255", "ref/all.zip", function(file) {
   // the method used to load zip with ajax will remove the extra bits.
   // adding extra bits :)
   var updatedFile = "";
   for (var i = 0; i < file.length; i++) {
      updatedFile += String.fromCharCode((file.charCodeAt(i) & 0xff) + 0x4200);
   }
   var zip = new JSZip(updatedFile);

   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
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
      equal(new JSZip(file).file("Hello.txt").asArrayBuffer().byteLength, 12, "don't get the original buffer");
      equal(new JSZip(file).file("Hello.txt").asUint8Array().buffer.byteLength, 12, "don't get a view of the original buffer");

      equal(new JSZip(file).file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
   });
}

if (JSZip.support.nodebuffer) {
   testZipFile("load(Buffer) works", "ref/all.zip", function(fileAsString) {
      var file = new Buffer(fileAsString.length);
      for( var i = 0; i < fileAsString.length; ++i ) {
         file[i] = fileAsString.charCodeAt(i);
      }

      equal(new JSZip(file).file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
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
      equal(new JSZip(file).file("Hello.txt").asArrayBuffer().byteLength, 12, "don't get the original buffer");
      equal(new JSZip(file).file("Hello.txt").asUint8Array().buffer.byteLength, 12, "don't get a view of the original buffer");

      equal(new JSZip(file).file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
   });
}

// zip -6 -X deflate.zip Hello.txt
testZipFile("zip with DEFLATE", "ref/deflate.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
});

// zip -0 -z -c archive_comment.zip Hello.txt
testZipFile("zip with comment", "ref/archive_comment.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
});

// zip -0 extra_attributes.zip Hello.txt
testZipFile("zip with extra attributes", "ref/extra_attributes.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
});

// use -fz to force use of Zip64 format
// zip -fz -0 zip64.zip Hello.txt
testZipFile("zip 64", "ref/zip64.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
});

// use -fd to force data descriptors as if streaming
// zip -fd -0 data_descriptor.zip Hello.txt
testZipFile("zip with data descriptor", "ref/data_descriptor.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
});

// combo of zip64 and data descriptors :
// zip -fz -fd -0 data_descriptor_zip64.zip Hello.txt
// this generate a corrupted zip file :(
// TODO : find how to get the two features

// zip -0 -X zip_within_zip.zip Hello.txt && zip -0 -X nested.zip Hello.txt zip_within_zip.zip
testZipFile("nested zip", "ref/nested.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hello.txt").asText(), "Hello World\n", "the zip was correctly read.");
   var nested = new JSZip(zip.file("zip_within_zip.zip").asBinary());
   equal(nested.file("Hello.txt").asText(), "Hello World\n", "the inner zip was correctly read.");
});

// zip -fd -0 nested_data_descriptor.zip data_descriptor.zip
testZipFile("nested zip with data descriptors", "ref/nested_data_descriptor.zip", function(file) {
   var zip = new JSZip(file);
   var nested = new JSZip(zip.file("data_descriptor.zip").asBinary());
   equal(nested.file("Hello.txt").asText(), "Hello World\n", "the inner zip was correctly read.");
});

// zip -fz -0 nested_zip64.zip zip64.zip
testZipFile("nested zip 64", "ref/nested_zip64.zip", function(file) {
   var zip = new JSZip(file);
   var nested = new JSZip(zip.file("zip64.zip").asBinary());
   equal(nested.file("Hello.txt").asText(), "Hello World\n", "the inner zip was correctly read.");
});

// nested zip 64 with data descriptors
// zip -fz -fd -0 nested_data_descriptor_zip64.zip data_descriptor_zip64.zip
// this generate a corrupted zip file :(
// TODO : find how to get the two features

// zip -X -0 utf8_in_name.zip €15.txt
testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(file) {
   var zip = new JSZip(file);
   ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
   equal(zip.file("€15.txt").asText(), "€15\n", "the utf8 content was correctly read (with file().asText).");
   equal(zip.files["€15.txt"].asText(), "€15\n", "the utf8 content was correctly read (with files[].astext).");
});

// zip backslash.zip -0 -X Hel\\lo.txt
testZipFile("Zip text file with backslash in filename", "ref/backslash.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.file("Hel\\lo.txt").asText(), "Hello World\n", "the utf8 content was correctly read.");
});

// use izarc to generate a zip file on windows
testZipFile("Zip text file from windows with \\ in central dir", "ref/slashes_and_izarc.zip", function(file) {
   var zip = new JSZip(file);
   equal(zip.folder("test").file("Hello.txt").asText(), "Hello world\r\n", "the content was correctly read.");
});

test("A folder stays a folder", function () {
   var zip = new JSZip();
   zip.folder("folder/");
   ok(zip.files['folder/'].options.dir, "the folder is marked as a folder");
   var reloaded = new JSZip(zip.generate({base64:false}));
   ok(reloaded.files['folder/'].options.dir, "the folder is marked as a folder");
});

// }}} Load file

QUnit.module("Load complex files"); // {{{

if (QUnit.urlParams.complexfiles) {

   // http://www.feedbooks.com/book/8/the-metamorphosis
   testZipFile("Franz Kafka - The Metamorphosis.epub", "ref/complex_files/Franz Kafka - The Metamorphosis.epub", function(file) {
      var zip = new JSZip(file);
      equal(zip.filter(function(){return true;}).length, 26, "the zip contains the good number of elements.");
      equal(zip.file("mimetype").asText(), "application/epub+zip\r\n", "the zip was correctly read.");
      // the .ncx file tells us that the first chapter is in the main0.xml file.
      ok(zip.file("OPS/main0.xml").asText().indexOf("One morning, as Gregor Samsa was waking up from anxious dreams") !== -1, "the zip was correctly read.");
   });

   // a showcase in http://msdn.microsoft.com/en-us/windows/hardware/gg463429
   testZipFile("Outlook2007_Calendar.xps", "ref/complex_files/Outlook2007_Calendar.xps", function(file) {
      var zip = new JSZip(file);
      // the zip file contains 15 entries, but we get 23 when creating all the sub-folders.
      equal(zip.filter(function(){return true;}).length, 23, "the zip contains the good number of elements.");
      ok(zip.file("[Content_Types].xml").asText().indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
   });

   // an example file in http://cheeso.members.winisp.net/srcview.aspx?dir=js-unzip
   // the data come from http://www.antarctica.ac.uk/met/READER/upper_air/
   testZipFile("AntarcticaTemps.xlsx", "ref/complex_files/AntarcticaTemps.xlsx", function(file) {
      var zip = new JSZip(file);
      // the zip file contains 16 entries, but we get 27 when creating all the sub-folders.
      equal(zip.filter(function(){return true;}).length, 27, "the zip contains the good number of elements.");
      ok(zip.file("[Content_Types].xml").asText().indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
   });

   // same as above, but in the Open Document format
   testZipFile("AntarcticaTemps.ods", "ref/complex_files/AntarcticaTemps.ods", function(file) {
      var zip = new JSZip(file);
      // the zip file contains 19 entries, but we get 27 when creating all the sub-folders.
      equal(zip.filter(function(){return true;}).length, 27, "the zip contains the good number of elements.");
      ok(zip.file("META-INF/manifest.xml").asText().indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
   });
}
// }}} Load complex files


// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
