var JSZipTestUtils = {
    loadZipFile : function (name, callback) {
        JSZipUtils.getBinaryContent(name + "?_=" + ( new Date() ).getTime(), callback);
    }
};
