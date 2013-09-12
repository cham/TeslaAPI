/*
 * Tesla API routes
 */
'use strict';

var _ = require('underscore'),
    express = require('express'),
    url = require('url'),
    api = require('../src/api/api'),
    args = require('argsparser').parse();

module.exports = function routing(){

    var app = new express.Router();

    function checkAuth(res, req, next){
        next();
    }

    // auth routes
    app.post('/login', checkAuth, function(req, res, next){
        api.users.getUsers(_(req.body || {}).extend({
            summary: true
        }), function(err, json){
            if(err){
                return next(err);
            }
            if(json.users.length){
                res.status(200);
                return res.send(json.users[0]);
            }
            res.status(400);
            res.send({message: 'Invalid credentials'});
        });
    });

    // comment routes
    // get
    app.get('/comments', checkAuth, function(req, res, next){
        api.comments.getComments(req.route.params || {}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/comments/summary', checkAuth, function(req, res, next){
        api.comments.getComments(_(req.route.params || {}).extend({
            summary: true
        }), function(err, comments){
            if(err){
                return next(err);
            }
            res.send({
                comments: comments
            });
        });
    });

    app.get('/comment/:commentId', checkAuth, function(req, res, next){
        api.comments.getComments({
            _id: req.route.params.commentId
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send(comment[0]);
        });
    });

    app.get('/comment/:commentId/summary', checkAuth, function(req, res, next){
        api.comments.getComments({
            _id: req.route.params.commentId,
            summary: true
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send(comment[0]);
        });
    });

    // post
    app.post('/comment', checkAuth, function(req, res, next){
        var body = req.body;

        api.threads.postComment({
            query: {
                postedby: body.postedby,
                content: body.content,
                threadid: body.threadid
            }
        }, function(err, thread){
            if(err){
                return next(err);
            }
            res.send({
                comment: thread
            });
        });
    });

    // thread routes
    // get
    app.get('/threads', checkAuth, function(req, res, next){
        api.threads.getThreads(req.query || {}, function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/threads/complete', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            populate: true
        }), function(err, threads){
            if(err){
                return next(err);
            }
            res.send({
                threads: threads
            });
        });
    });

    app.get('/threads/summary', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            summary: true
        }), function(err, threads){
            if(err){
                return next(err);
            }
            res.send({
                threads: threads
            });
        });
    });

    app.get('/thread/:threadUrlName', checkAuth, function(req, res, next){
        api.threads.getThread(_(req.query || {}).extend({
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }), function(err, thread){
            if(err){
                return next(err);
            }
            res.send(thread[0]);
        });
    });

    app.get('/thread/:threadUrlName/complete', checkAuth, function(req, res, next){
        api.threads.getThread(_(req.query || {}).extend({
            populate: true,
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }), function(err, thread){
            if(err){
                return next(err);
            }
            res.send(thread[0]);
        });
    });

    app.get('/thread/:threadUrlName/summary', checkAuth, function(req, res, next){
        api.threads.getThread({
            summary: true,
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }, function(err, thread){
            if(err){
                return next(err);
            }
            res.send(thread[0]);
        });
    });

    // post
    app.post('/thread', checkAuth, function(req, res, next){
        var body = req.body;

        api.threads.postThread({
            query: {
                name: body.name,
                postedby: body.postedby,
                categories: body.categories,
                content: body.content
            }
        }, function(err, data){
            if(err){
                res.status(500);
                return res.send({
                    msg: err.toString()
                });
            }
            res.send(data);
        });
    });

    // user routes
    // get
    app.get('/users', checkAuth, function(req, res, next){
        api.users.getUsers(req.route.params || {}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/users/summary', checkAuth, function(req, res, next){
        api.users.getUsers(_(req.route.params || {}).extend({
            summary: true
        }), function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/user/:userName', checkAuth, function(req, res, next){
        api.users.getUsers({
            query: {
                username: req.route.params.userName
            }
        }, function(err, json){
            if(err){
                return next(err);
            }
            res.send(json.users[0]);
        });
    });

    app.get('/user/:userName/summary', checkAuth, function(req, res, next){
        api.users.getUser({
            query: {
                username: req.route.params.userName
            },
            summary: true
        }, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    // post
    app.post('/user', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.addUser({
            query: {
                username: body.username,
                password: body.password,
                email: body.email,
                ip: req.connection.remoteAddress
            }
        }, function(err, data){
            if(err){
                return next(err);
            }

            res.send(data);
        });
    });

    // delete
    app.delete('/users', checkAuth, function(req, res, next){
        api.users.deleteAllUsers(function(err){
            if(err){
                return next(err);
            }
            res.statusCode = 200;
            res.send({msg: 'ok'});
        });
    });

    app.delete('/user/:userName', checkAuth, function(req, res, next){
        api.users.deleteUser({
            username: req.route.params.userName
        }, function(err){
            if(err){
                return next(err);
            }
            res.statusCode = 200;
            res.send({msg: 'ok'});
        });
    });

    app.get('*', function(req, res, next){
        res.statusCode = 404;
        return next();
    });

    return app.middleware;

};