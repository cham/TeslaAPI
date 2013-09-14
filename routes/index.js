/*
 * Tesla API routes
 */
'use strict';

var express = require('express'),
    comments = require('./comments'),
    threads = require('./threads'),
    users = require('./users'),
    stresstest = false,
    stressTester = stresstest ? require('../src/stressTester') : {routing:function(){}};

module.exports = function routing(){

    var app = new express.Router();

    if(stresstest){
        stressTester.routing(app);
    }

    // comments
    comments(app);
    threads(app);
    users(app);

    app.get('*', function(req, res, next){
        res.statusCode = 404;
        return next();
    });

    return app.middleware;

};