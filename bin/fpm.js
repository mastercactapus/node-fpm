#!/usr/bin/env node

var cli = require("commander");

cli.command("install <packages>...")
.description("install packages")
.action(function(pkg){

});

cli.parse(process.argv);
