(function (root) {
   var JSZipTestUtils = {};
   // just use the responseText when not in IE
   // The transformation throws away high-order byte, as documented at :
   // https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
   // Note : if you just want to give it to JSZip.load, you can skip this part
   // (this transformation is already done there) and just return responseText.
   JSZipTestUtils.getBinaryFromXHR = function (xhr) {
      // we skip the & 0xFF part, since this must be tested in the JSZip tests.
      if (xhr.response) {
         if (JSZip.support.arraybuffer && xhr.response instanceof ArrayBuffer) {
            return JSZip.utils.uint8Array2String(new Uint8Array(xhr.response));
         }
         return xhr.response;
      } else {
         return xhr.responseText;
      }
      // if you check this method to know how to load binay data, remove this return :)

      return JSZip.utils.string2binary(xhr.responseText);
   };

   // taken from jQuery
   function createStandardXHR() {
      try {
         return new window.XMLHttpRequest();
      } catch( e ) {}
   }

   function createActiveXHR() {
      try {
         return new window.ActiveXObject("Microsoft.XMLHTTP");
      } catch( e ) {}
   }

   var isLocal = window.location.protocol === "file:";

   // Create the request object
   var createXHR = window.ActiveXObject ?
      /* Microsoft failed to properly
       * implement the XMLHttpRequest in IE7 (can't request local files),
       * so we use the ActiveXObject when it is available
       * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
       * we need a fallback.
       */
      function() {
      return !isLocal && createStandardXHR() || createActiveXHR();
   } :
      // For all other browsers, use the standard XMLHttpRequest object
      createStandardXHR;



   JSZipTestUtils.loadZipFile = function(zipName, success, error) {
      /*
       * Here is the tricky part : getting the data.
       * In firefox/chrome/opera/... setting the mimeType to 'text/plain; charset=x-user-defined'
       * is enough, the result is in the standard xhr.responseText.
       * cf https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Receiving_binary_data_in_older_browsers
       * In IE <= 9, we must use (the IE only) attribute responseBody
       * (for binary data, its content is different from responseText).
       * In IE 10, the 'charset=x-user-defined' trick doesn't work, only the
       * responseType will work :
       * http://msdn.microsoft.com/en-us/library/ie/hh673569%28v=vs.85%29.aspx#Binary_Object_upload_and_download
       *
       * I'd like to use jQuery to avoid this XHR madness, but it doesn't support
       * the responseType attribute : http://bugs.jquery.com/ticket/11461
       */
      try {

         var xhr = createXHR();

         xhr.open('GET', zipName + "?_=" + ( new Date() ).getTime(), true);

         // recent browsers
         if ("responseType" in xhr) {
            xhr.responseType = "arraybuffer";
         }

         // older browser
         if(xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
         }

         xhr.onreadystatechange = function(e) {
            // use `xhr` and not `this`... thanks IE
            if (xhr.readyState === 4) {
               if (xhr.status === 200 || isLocal) {
                  try {
                     // this.xhr comes from the context
                     var file = JSZipTestUtils.getBinaryFromXHR(xhr);
                     success(file);
                  } catch(e) {
                     error(e.message||e);
                  }
               } else {
                  error("Ajax error for " + zipName + " : " + this.status);
               }
            }
         };

         xhr.send();

      } catch (e) {
         error("Ajax error for " + zipName + " : " + (e.message||e));
      }
   };

   // export
   root.JSZipTestUtils = JSZipTestUtils;
})(this);

// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
