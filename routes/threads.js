/*
 * threads routing
 *
 * GET
 *      /threads
 *      /threads/complete
 *      /threads/summary
 *      /threads/count
 *      /thread/:threadUrlName
 *      /thread/:threadUrlName/complete
 *      /thread/:threadUrlName/summary
 *      /randomthread
 *      /user/:username/threads
 *      /user/:username/threads/summary
 *      /user/:username/threads/complete
 *      /user/:username/hidden
 *      /user/:username/hidden/summary
 *      /user/:username/favourites
 *      /user/:username/favourites/summary
 *      /user/:username/participated
 *      /user/:username/participated/summary
 *
 * POST
 *      /thread
 *      /comment
 *
 * PUT
 *      /thread/:threadUrlName
 *
 */
var _ = require('underscore'),
    api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){
    
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
        api.threads.getThread(_(req.query || {}).extend({
            summary: true,
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
    app.get('/user/:username/threads', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            excludelist: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/threads/summary', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username,
            },
            threadquery: {
                categories: req.query.categories,
                name: req.query.name,
                postedby: req.query.postedby
            },
            listkey: 'hidden', // array here would allow hidden and not ignored
            excludelist: true,
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/threads/complete', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            excludelist: true,
            populate: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    // participated, favourites, hidden, buddy, ignore
    app.get('/user/:username/participated', checkAuth, function(req, res, next){
        api.threads.getParticipated(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            }
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/favourites', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/hidden', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/participated/summary', checkAuth, function(req, res, next){
        api.threads.getParticipated(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/favourites/summary', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites',
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/hidden/summary', checkAuth, function(req, res, next){
        api.threads.getThreadsInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
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

    // update thread
    app.put('/thread/:urlname', checkAuth, function(req, res, next){
        var body = req.body,
            updateData = {};

        if(body.closed){
            updateData.closed = body.closed === 'true';
        }
        if(body.nsfw){
            updateData.nsfw = body.nsfw === 'true';
        }

        api.threads.updateThread(_.extend(updateData, req.query, {
            query: {
                urlname: encodeURIComponent(req.route.params.urlname)
            }
        }), function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });

};