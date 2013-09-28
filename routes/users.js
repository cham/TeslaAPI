/*
 * users routing
 *
 * GET
 *      /users
 *      /users/count
 *      /users/summary
 *      /user/:username
 *      /user/:username/summary
 *      /user/:username/buddies
 *      /user/:username/buddies/summary
 *      /user/:username/ignores
 *      /user/:username/ignores/summary
 *
 * POST
 *      /user
 *      /login
 * PUT
 *      /user/:username/hide
 *      /user/:username/buddy
 *      /user/:username/ignore
 *      /user/:username/favourite
 * 
 * DELETE
 *      /users
 *      /user/:username
 */
var _ = require('underscore'),
    api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){

    // users
    app.get('/users', checkAuth, function(req, res, next){
        api.users.getUsers(req.route.params || {}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/users/count', checkAuth, function(req, res, next){
        api.users.getUsers(_(req.route.params || {}).extend({
            countonly: true
        }), function(err, data){
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

    app.get('/user/:username', checkAuth, function(req, res, next){
        api.users.getUsers({
            query: {
                username: req.route.params.username
            }
        }, function(err, json){
            if(err){
                return next(err);
            }
            res.send(json.users[0]);
        });
    });

    app.get('/user/:username/summary', checkAuth, function(req, res, next){
        api.users.getUser({
            query: {
                username: req.route.params.username
            },
            summary: true
        }, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });
    
    app.get('/user/:username/buddies', checkAuth, function(req, res, next){
        api.users.getUsersInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'buddies'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/ignores', checkAuth, function(req, res, next){
        api.users.getUsersInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'ignores'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/buddies/summary', checkAuth, function(req, res, next){
        api.users.getUsersInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'buddies',
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
    
    app.get('/user/:username/ignores/summary', checkAuth, function(req, res, next){
        api.users.getUsersInUserList(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'ignores',
            summary: true
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    // post
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
    app.put('/user/:username/unfavourite', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'favourites',
            listval: req.body.listval,
            removefromlist: true
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
    // buddy
    app.put('/user/:username/buddy', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'buddies',
            listval: req.body.listval
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // ignore
    app.put('/user/:username/ignore', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'ignores',
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

    app.delete('/user/:username', checkAuth, function(req, res, next){
        api.users.deleteUser({
            username: req.route.params.username
        }, function(err){
            if(err){
                return next(err);
            }
            res.statusCode = 200;
            res.send({msg: 'ok'});
        });
    });
};