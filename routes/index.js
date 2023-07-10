/*jslint node: true */
/*
 * Tesla API routes
 */
'use strict';

var express = require('express');
var comments = require('./comments');
var threads = require('./threads');
var users = require('./users');
var points = require('./points');
var questions = require('./questions');
var pendingUsers = require('./pendingUsers');

var stresstest = false;
var stressTester = stresstest ? require('../src/stressTester') : {routing:function(){}};
var whitelistedHosts = [
    'localhost',
    'api:3100',
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
    questions(app);
    pendingUsers(app);

    app.get('*', function(req, res, next){
        res.statusCode = 404;
        return next();
    });

    return app.middleware;

};