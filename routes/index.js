/*
 * Tesla API routes
 */
'use strict';

var express = require('express'),
    url = require('url'),
    api = require('../lib/api'),
    args = require('argsparser').parse();

module.exports = function routing(){

    var app = new express.Router();

    function checkAuth(res, req, next){
        next();
    }

    app.get('/users', checkAuth, function(req, res, next){
        api.users.listUsers({},function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/users/summary', checkAuth, function(req, res, next){
        api.users.listUsers({summary: true}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/user/:userName', checkAuth, function(req, res, next){
        api.users.getUser({
            username: req.route.params.userName
        }, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/user/:userName/summary', checkAuth, function(req, res, next){
        api.users.getUser({
            username: req.route.params.userName,
            summary: true
        }, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/fakeuser', checkAuth, function(req, res, next){
        api.users.addUser({
            username: 'cham',
            password: 'b33d065',
            email: 'danneame@gmail.com',
            ip: req.connection.remoteAddress
        }, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('*', function(req, res, next){
        res.statusCode = 404;
        return next();
    });

    return app.middleware;

};