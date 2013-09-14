/*
 * Tesla API routes
 */
'use strict';

var _ = require('underscore'),
    express = require('express'),
    url = require('url'),
    api = require('../src/api/api'),
    stresstest = false,
    stressTester = stresstest ? require('../src/stressTester') : {routing:function(){}};

module.exports = function routing(){

    var app = new express.Router();

    function checkAuth(res, req, next){
        next();
    }
    if(stresstest){
        stressTester.routing(app);
    }

    /*
     * get
     */
    // comment routes
    app.get('/comments', checkAuth, function(req, res, next){
        api.comments.getComments(req.route.params || {}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/comments/count', checkAuth, function(req, res, next){
        api.comments.getComments(_(req.route.params || {}).extend({
            countonly: true
        }), function(err, data){
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

    // thread routes
    // get
    app.get('/threads', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            query: {
                categories: req.query.categories
            }
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/threads/complete', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            query: {
                categories: req.query.categories
            },
            populate: true
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/threads/summary', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            query: {
                categories: req.query.categories,
                name: req.query.name,
                postedby: req.query.postedby
            },
            summary: true
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/threads/count', checkAuth, function(req, res, next){
        api.threads.getThreads(_(req.query || {}).extend({
            countonly: true
        }), function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/thread/:threadUrlName', checkAuth, function(req, res, next){
        api.threads.getThread(_(req.query || {}).extend({
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/thread/:threadUrlName/complete', checkAuth, function(req, res, next){
        api.threads.getThread(_(req.query || {}).extend({
            populate: true,
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/thread/:threadUrlName/summary', checkAuth, function(req, res, next){
        api.threads.getThread({
            summary: true,
            query: {
                urlname: encodeURIComponent(req.route.params.threadUrlName)
            }
        }, function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

    app.get('/randomthread', checkAuth, function(req, res, next){
        api.threads.getThreads({
            countonly: true
        }, function(err, data){
            if(err) return next(err);

            var i = Math.floor(Math.random() * data.totaldocs);

            api.threads.getThreads({
                size: 1,
                page: i
            }, function(err, json){
                if(err) return next(err);

                res.send(json);
            });
        });
    });

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

    // participated, favourites, hidden
    app.get('/user/:username/participated', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'participated'
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    app.get('/user/:username/favourites', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites'
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    app.get('/user/:username/hidden', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden'
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    app.get('/user/:username/participated/summary', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'participated',
            summary: true
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    app.get('/user/:username/favourites/summary', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites',
            summary: true
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    app.get('/user/:username/hidden/summary', checkAuth, function(req, res, next){
        api.threads.getUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            summary: true
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });



    /*
     * post
     */
    // new user
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

    // new thread
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

    // login
    app.post('/login', checkAuth, function(req, res, next){
        api.users.getUsers({
            query: req.body
        }, function(err, json){
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

    // comment
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


    /*
     * put
     */
     // NB - should these be PATCH instead of PUT?
    // favourite
    app.put('/user/:username/favourite', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites',
            listval: req.body.listval
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // hide
    app.put('/user/:username/hide', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            listval: req.body.listval
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });


    /*
     * delete
     */
    // user
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