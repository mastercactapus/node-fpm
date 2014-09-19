var fibrous = require("fibrous");
var request = require("request");
var Future = require("fibers/future");
var semver = require("semver");
var _ = require("lodash");

function ResolverCache(baseUrl) {
    this.cache = {};
    this.baseUrl = baseUrl.replace(/\/$/,"");
}

ResolverCache.prototype = {
    getCache: function(name, version) {
        if (!this.cache[name]) return null;
        if (this.cache[name][version]) return this.cache[name][version] || null;

        var versions = _.keys(this.cache[name]);
        var maxVer = semver.maxSatisfying(versions, version);
        if (!maxVer) return null;
        return this.cache[name][maxVer];
    },
    setCache: function(name, data) {
        if (!this.cache[name]) this.cache[name] = {};
        this.cache[name][data.version] = data;
    },
    get: function(name, version) {
        var cached = this.getCache(name, version);
        if (cached) return cached;

        var data = request.sync.get({uri: this.baseUrl + "/" + name + "/" + version,json:true}).body;
        this.setCache(name, data);
        return data;
    }
};

module.exports = ResolverCache;
