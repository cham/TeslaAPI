/*jslint node: true */
/*
 * Tesla API routes
 */
'use strict';

var express = require('express'),
    comments = require('./comments'),
    threads = require('./threads'),
    users = require('./users'),
    points = require('./points'),
    stresstest = false,
    stressTester = stresstest ? require('../src/stressTester') : {routing:function(){}},
    whitelistedHosts = [
        'localhost'
    ];

module.exports = function routing(){

    var app = new express.Router();

    if(stresstest){
        stressTester.routing(app);
    }

    app.get('*', function(req, res, next){
        var host = req.headers.host;
        var hostOk = whitelistedHosts.reduce(function(memo, whitelisted){
            return memo || host.indexOf(whitelisted) === 0;
        }, false);

        if(hostOk){
            next();
        }else{
            res.status(403);
            res.end();
        }
    });

    comments(app);
    threads(app);
    users(app);
    points(app);

    app.get('*', function(req, res, next){
        res.statusCode = 404;
        return next();
    });

    return app.middleware;

};