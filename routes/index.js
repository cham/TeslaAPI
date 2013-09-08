/*
 * Tesla API routes
 */
'use strict';

var express = require('express'),
    url = require('url'),
    // api = require('./lib/api'),
    args = require('argsparser').parse();

module.exports = function routing(){

    var app = new express.Router();

    function checkAuth(res, req, next){
        next();
    }

    app.get('/users', checkAuth, function(req, res){
        // api.projects(req, res);
        res.send({
            username: 'cham'
        });
    });

    app.get('*', function(req, res){
        res.statusCode = 404;
        res.end();
    });

    return app.middleware;

};