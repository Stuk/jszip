/* global JSZip,JSZipUtils,JSZipTestUtils */
'use strict';
JSZipTestUtils.loadZipFile = function (name, callback) {
    JSZipUtils.getBinaryContent(name + "?_=" + ( new Date() ).getTime(), callback);
};
