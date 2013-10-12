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
 *      /user/:username/inbox
 *      /user/:username/outbox
 *      /user/:username/message/:messageid
 *      /user/:username/ping
 *
 * POST
 *      /user
 *      /login
 *      /user/:username/sendmessage
 * PUT
 *      /user/:username/hide
 *      /user/:username/buddy
 *      /user/:username/ignore
 *      /user/:username/favourite
 *      /user/:username/messages/read
 *      /user/:username/messages/unread
 *      /user/:username/messages/recipient/delete
 *      /user/:username/messages/recipient/undelete
 * 
 * DELETE
 *      /users
 *      /user/:username
 */
var _ = require('underscore'),
    bcrypt = require('bcrypt'),
    async = require('async'),
    api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){

    function bulkUpdate(query, ids, bulkaction, done){
        api.messages.bulkUpdate({
            query: query,
            ids: ids,
            bulkaction: function(data){
                bulkaction(data);
            },
        }, function(err, json){
            if(err) return done(err);

            done(null, json);
        });
    }

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

    app.get('/user/:username/inbox', checkAuth, function(req, res, next){
        api.messages.getMessages({
            query: {
                recipient: req.route.params.username,
                recipient_deleted: false
            },
            limit: 50
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/outbox', checkAuth, function(req, res, next){
        api.messages.getMessages({
            query: {
                sender: req.route.params.username,
                sender_deleted: false
            },
            limit: 50
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/message/:messageid', checkAuth, function(req, res, next){
        var username = req.route.params.username;

        api.messages.getMessages({
            query: {
                _id: req.route.params.messageid
            },
            limit: 1
        }, function(err, json){
            if(err) return next(err);

            if(!json || !json.messages || !json.messages.length) return res.send('', 401);
            var message = json.messages[0];

            if(message.sender !== username && message.recipient !== username) return res.send('', 401);

            res.send(message);
        });
    });

    app.get('/user/:username/ping', checkAuth, function(req, res, next){
        api.users.ping({
            query: {
                username: req.route.params.username,
            },
            ip: req.connection.remoteAddress
        }, function(err, json){
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
        api.users.getUser({
            query: {username: req.body.username}
        }, function(err, user){
            if(err) return next(err);

            if(!req.body.password || !user.password || !bcrypt.compareSync(req.body.password, user.password)){
                return res.send({message: 'Invalid credentials'}, 401);
            }

            api.messages.getInboxSize(user.username, function(err, json){
                if(err) return done(err);

                var userData = user.toJSON();

                if(json.totaldocs) userData.inbox = json.totaldocs;
                res.send(userData);
            });
        });
    });

    // send message
    app.post('/user/:username/sendmessage', checkAuth, function(req, res, next){
        var body = req.body || {},
            recipients = body.recipients || [],
            errors = [],
            messages = [];

        async.parallel(
            _(recipients).reduce(function(memo, recipient){
                memo.push(function(done){
                    api.messages.sendMessage({
                        query: {
                            sender: req.route.params.username,
                            recipient: recipient,
                            subject: body.subject,
                            content: body.content
                        }
                    }, function(err, message){
                        if(err) return done(err);

                        done(null, message);
                    });
                });
                return memo;
            }, []),
            function(err, messages){
                if(err) return next(err);

                res.send({
                    messages: messages
                });
            }
        );
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
    app.put('/user/:username/unhide', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'hidden',
            listval: req.body.listval,
            removefromlist: true
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
    app.put('/user/:username/unbuddy', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'buddies',
            listval: req.body.listval,
            removefromlist: true
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
    app.put('/user/:username/unignore', checkAuth, function(req, res, next){
        api.users.updateUserList({
            query: {
                username: req.route.params.username
            },
            listkey: 'ignores',
            listval: req.body.listval,
            removefromlist: true
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // read message
    app.put('/user/:username/message/:messageid/read', checkAuth, function(req, res, next){
        api.messages.readMessage({
            query: {
                recipient: req.route.params.username,
                _id: req.route.params.messageid
            }
        }, function(err, message){
            if(err) return next(err);
            
            if(!message) return res.send('', 401);

            res.send(message);
        });
    });
    // batch read messages
    app.put('/user/:username/messages/read', checkAuth, function(req, res, next){
        var username = req.route.params.username;

        bulkUpdate({ recipient: username }, req.body.ids, function(message){
            message.read = true;
        }, function(err, messages){
            if(err) return next(err);

            res.send({
                messages: messages
            });
        });
    });
    // batch unread messages
    app.put('/user/:username/messages/unread', checkAuth, function(req, res, next){
        var username = req.route.params.username;

        bulkUpdate({ recipient: username }, req.body.ids, function(message){
            message.read = false;
        }, function(err, messages){
            if(err) return next(err);

            res.send({
                messages: messages
            });
        });
    });
    // batch recipient delete messages
    app.put('/user/:username/messages/recipient/delete', checkAuth, function(req, res, next){
        var username = req.route.params.username;

        bulkUpdate({ recipient: username }, req.body.ids, function(message){
            message.recipient_deleted = true;
        }, function(err, messages){
            if(err) return next(err);

            res.send({
                messages: messages
            });
        });
    });
    // batch sender delete messages
    app.put('/user/:username/messages/sender/delete', checkAuth, function(req, res, next){
        var username = req.route.params.username;

        bulkUpdate({ sender: username }, req.body.ids, function(message){
            message.sender_deleted = true;
        }, function(err, messages){
            if(err) return next(err);

            res.send({
                messages: messages
            });
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