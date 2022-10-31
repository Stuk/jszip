"use strict";

QUnit.module("permissions", function () {


    // touch file_{666,640,400,755}
    // mkdir dir_{777,755,500}
    // for mode in 777 755 500 666 640 400; do
    //    chmod $mode *_$mode
    // done
    // then :
    // zip -r linux_zip.zip .
    // 7z a -r linux_7z.zip .
    // ...
    function assertUnixPermissions(assert, file){
        function doAsserts(zip, fileName, dir, octal) {
            var mode = parseInt(octal, 8);
            assert.equal(zip.files[fileName].dosPermissions, null, fileName + ", no DOS permissions");
            assert.equal(zip.files[fileName].dir, dir, fileName + " dir flag");
            assert.equal(zip.files[fileName].unixPermissions, mode, fileName + " mode " + octal);
        }

        var done = assert.async();
        JSZip.loadAsync(file, {createFolders:false})
            .then(function(zip) {
                doAsserts(zip, "dir_777/", true,  "40777");
                doAsserts(zip, "dir_755/", true,  "40755");
                doAsserts(zip, "dir_500/", true,  "40500");
                doAsserts(zip, "file_666", false, "100666");
                doAsserts(zip, "file_640", false, "100640");
                doAsserts(zip, "file_400", false, "100400");
                doAsserts(zip, "file_755", false, "100755");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    }

    function assertDosPermissions(assert, file){
        function doAsserts(zip, fileName, dir, binary) {
            var mode = parseInt(binary, 2);
            assert.equal(zip.files[fileName].unixPermissions, null, fileName + ", no UNIX permissions");
            assert.equal(zip.files[fileName].dir, dir, fileName + " dir flag");
            assert.equal(zip.files[fileName].dosPermissions, mode, fileName + " mode " + mode);
        }

        var done = assert.async();
        JSZip.loadAsync(file, {createFolders:false})
            .then(function(zip) {
                if (zip.files["dir/"]) {
                    doAsserts(zip, "dir/",           true,  "010000");
                }
                if (zip.files["dir_hidden/"]) {
                    doAsserts(zip, "dir_hidden/",    true,  "010010");
                }
                doAsserts(zip, "file",           false, "100000");
                doAsserts(zip, "file_ro",        false, "100001");
                doAsserts(zip, "file_hidden",    false, "100010");
                doAsserts(zip, "file_ro_hidden", false, "100011");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    }

    function reloadAndAssertUnixPermissions(assert, file){
        var done = assert.async();
        JSZip.loadAsync(file, {createFolders:false})
            .then(function (zip) {
                return zip.generateAsync({type:"string", platform:"UNIX"});
            })
            .then(function (content) {
                assertUnixPermissions(assert, content);
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    }
    function reloadAndAssertDosPermissions(assert, file){
        var done = assert.async();
        JSZip.loadAsync(file, {createFolders:false})
            .then(function (zip) {
                return zip.generateAsync({type:"string", platform:"DOS"});
            })
            .then(function (content) {
                assertDosPermissions(assert, content);
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    }
    JSZipTestUtils.testZipFile("permissions on linux : file created by zip", "ref/permissions/linux_zip.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by zip, reloaded", "ref/permissions/linux_zip.zip", reloadAndAssertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by 7z", "ref/permissions/linux_7z.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by 7z, reloaded", "ref/permissions/linux_7z.zip", reloadAndAssertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by file-roller on ubuntu", "ref/permissions/linux_file_roller-ubuntu.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by file-roller on ubuntu, reloaded", "ref/permissions/linux_file_roller-ubuntu.zip", reloadAndAssertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by file-roller on xubuntu", "ref/permissions/linux_file_roller-xubuntu.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by file-roller on xubuntu, reloaded", "ref/permissions/linux_file_roller-xubuntu.zip", reloadAndAssertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by ark", "ref/permissions/linux_ark.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on linux : file created by ark, reloaded", "ref/permissions/linux_ark.zip", reloadAndAssertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on mac : file created by finder", "ref/permissions/mac_finder.zip", assertUnixPermissions);
    JSZipTestUtils.testZipFile("permissions on mac : file created by finder, reloaded", "ref/permissions/mac_finder.zip", reloadAndAssertUnixPermissions);


    JSZipTestUtils.testZipFile("permissions on windows : file created by the compressed folders feature", "ref/permissions/windows_compressed_folders.zip", assertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by the compressed folders feature, reloaded", "ref/permissions/windows_compressed_folders.zip", reloadAndAssertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by 7z", "ref/permissions/windows_7z.zip", assertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by 7z, reloaded", "ref/permissions/windows_7z.zip", reloadAndAssertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by izarc", "ref/permissions/windows_izarc.zip", assertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by izarc, reloaded", "ref/permissions/windows_izarc.zip", reloadAndAssertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by winrar", "ref/permissions/windows_winrar.zip", assertDosPermissions);
    JSZipTestUtils.testZipFile("permissions on windows : file created by winrar, reloaded", "ref/permissions/windows_winrar.zip", reloadAndAssertDosPermissions);

});
