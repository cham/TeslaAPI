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
};