"use strict";

module.exports = function(grunt) {
    var version = require("./package.json").version;

    grunt.initConfig({
        browserify: {
            all: {
                files: {
                    "dist/jszip.js": ["lib/index.js"]
                },
                options: {
                    browserifyOptions: {
                        standalone: "JSZip",
                        transform: ["package-json-versionify"],
                        insertGlobalVars: {
                            process: undefined,
                            Buffer: undefined,
                            __filename: undefined,
                            __dirname: undefined
                        },
                        builtins: false
                    },
                    banner: grunt.file.read("lib/license_header.js").replace(/__VERSION__/, version)
                }
            }
        },
        uglify: {
            options: {
                mangle: true,
                preserveComments: false,
                banner: grunt.file.read("lib/license_header.js").replace(/__VERSION__/, version)
            },
            all: {
                src: "dist/jszip.js",
                dest: "dist/jszip.min.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    var packagePath = "package.json";
    var browserIndexKey = "./lib/index";

    grunt.registerTask("unmap-browser-entry", function() {
        var original = grunt.file.read(packagePath);
        var pkg = JSON.parse(original);

        if (!pkg.browser || !pkg.browser[browserIndexKey]) {
            return;
        }

        grunt.config.set("packageJsonBackup", original);
        var browser = Object.assign({}, pkg.browser);
        delete browser[browserIndexKey];
        pkg.browser = browser;
        grunt.file.write(packagePath, JSON.stringify(pkg, null, 2));
    });

    grunt.registerTask("restore-browser-entry", function() {
        var original = grunt.config.get("packageJsonBackup");

        if (!original) {
            return;
        }

        grunt.file.write(packagePath, original);
        grunt.config.set("packageJsonBackup", null);
    });

    grunt.registerTask("build", [
        "unmap-browser-entry",
        "browserify",
        "uglify",
        "restore-browser-entry"
    ]);
    grunt.registerTask("default", ["build"]);
};
