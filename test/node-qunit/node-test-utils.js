fs = require('fs');

module.exports = {
   loadZipFile : function(name, success, error) {
      try {
         fs.readFile(name, "binary", function (err,data) {
            if(err) {
               error(err);
            } else {
               success(data);
            }
         });
      } catch (e) {
         error(e);
      }
   }
};

// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
