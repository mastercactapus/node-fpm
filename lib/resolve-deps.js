var Future = require("fibers/future");
var semver = require("semver");
var _ = require("lodash");
// var ResolverCache = require("./resolver-cache");
var http = require("http");
var url = require("url");
var zlib = require("zlib")

function get(uri) {
    var fut = new Future;
    var urlObj = url.parse(uri);
    http.get({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.path,
        headers: {
            "accept-encoding": "gzip"
        }
    }, function(res){
        if (res.statusCode !== 200) return reject(res);
        var stream;
        if (res.headers["content-encoding"] === "gzip") {
            stream = res.pipe(zlib.createGunzip());
        } else {
            stream = res;
        }

        var buffs = [];
        stream.on("data", function(chunk){
            buffs.push(chunk);
        });

        stream.on("end", function(){
            fut.return(Buffer.concat(buffs));
        });
    })
    .on("error", fut.throw);
    return fut;
}

function Package(name) {
    this.name = name;
    this.candidate = null;
    this.required = [];
    this.cache = {};
    this.baseUrl = "http://registry.npmjs.org"
    _.bindAll(this);
}
Package.prototype = {
    add: function(versionRange) {
        if (this.name==="hawk") versionRange = "2.x";
        if (_.contains(this.required, versionRange)) return;

        this.required.push(versionRange);
        this.updateCandidate();
    },
    valid: function(version) {
        var version = version || this.candidate;
        return _.all(this.required, function(requirement){
            return semver.satisfies(version, requirement);
        });
    },
    validVersions: function() {
        return _.filter(this.availableVersions(), this.valid);
    },
    getData: function(version) {
        if (this.cache[version]) return this.cache[version];
        var uri = this.baseUrl + "/" + this.name + (version?"/" + version:"");



        return this.cache[version] = JSON.parse(get(uri).wait());
    },
    get: function() {
        return this.getData().versions[this.candidate];
    },
    availableVersions: function() {
        if (this._availableVersions) return this._availableVersions;
        var versions = _.keys(this.getData().versions);
        versions.sort(function(a,b){
            if (semver.eq(a,b)) return 0;
            if (semver.gt(a,b)) return 1;
            else return -1;
        });

        return this._availableVersions = versions;
    },
    findValidVersion: function() {
        return _.findLast(this.availableVersions(), this.valid);
    },
    updateCandidate: function() {
        var version = this.findValidVersion();
        if (!version) {
            throw new Error("No valid candidate for " + this.name + " to satisfy " + this.required.join(" "));
        }
        this.candidate = version;
    }
}

function Resolver(cache) {
    this.cache = cache||exports.defaultCache;

    this.packages = {};
    _.bindAll(this);
}

Resolver.prototype = {
    add: function(name, version, returnNothing) {
        version = version.replace("~", "^");
        if (!this.packages[name]) this.packages[name] = new Package(name);
        this.packages[name].add(version);

        var data = this.packages[name].get();
        var self = this;
        var wait = _.map(data.dependencies||{}, function(vers, depName){
            console.log("ADD",depName + "@" + vers,"from", name + "@" + version);

            return self.add(depName, vers, true);
        });

        Future.wait(wait);

        if (returnNothing) return;

        return _.map(this.packages, function(pkg, name){
            return name + "@" + pkg.candidate;
        });

    }.future()
};



// exports.defaultCache = new ResolverCache("http://registry.npmjs.org");
exports.defaultResolver = new Resolver(exports.defaultCache);
exports.resolve = function(package) {
    var split = package.split("@");
    var packageName = split[0];
    var packageVersion = split[1] || "";

    var deps = exports.defaultResolver.add(packageName, packageVersion).wait();

    return deps;
}.future()
