var path = require("path");
var Future = require("fibers/future");
var fs = require("fs");
exports.pkgDir = path.resolve(process.env.XDG_DATA_HOME || (process.env.HOME ? path.join(process.env.HOME, ".local/share") : ""), "fpm/packages");



exports.package = function(name, version) {

};
