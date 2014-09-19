var path = require("path");
var ini = require("ini");
var _ = require("lodash");

function getPath(varname, defaultVal, pathname) {
    var env = process.env;
    var base;
    if (env[varname]) {
        base = process.env[varname];
    } else if (env.HOME) {
        base = path.resolve(env.HOME, defaultVal);
    } else if (env.HOMEDIR) {
        base = path.resolve(env.HOMEDIR, defaultVal);
    } else {
        base = ".fpm";
    }

    return path.resolve(base, pathname);
}

function defineAttrs(fn, attributes) {
    fn.defaults = attributes;
    fn.params = _.keys(attributes)
    _.each(attributes, function(value, name){
        Object.defineProperty(fn.prototype, name, {
            enumerable: true,
            get: function() {
                var val = this["_" + name];
                return typeof val === "undefined" ? value : val;
            },
            set: function(value) {
                this["_" + name] = value;
                this.save();
            }
        });
    });
}

function Config(filename) {
    Object.defineProperty(this, "filename", {
        enumerable: false,
        value: filename || getPath("XDG_CONFIG_HOME", ".config", "fpm/fpm.conf")
    });
    this.reload();
}
Config.defaults = {
    package_dir: getPath("XDG_DATA_HOME", ".local/share", "fpm/packages"),
    cache_dir: getPath("XDG_CACHE_HOME", ".cache", "fpm"),
    registry: "http://npm.channelopen.net"
}

Config.prototype = {
    get: function(key) {

    },
    set: function(key, value) {

    },
    reload: function() {

    },
    save: function() {

    }
}

defineAttrs(Config,{
});
var cfg = new Config();
console.log(ini.encode(cfg));
console.log(JSON.stringify(new Config()))


exports.pkgDir = path.resolve(process.env.XDG_DATA_HOME || (process.env.HOME ? path.join(process.env.HOME, ".local/share") : ""), "fpm/packages");
