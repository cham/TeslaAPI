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
 *      /user/:username/buddyof
 *      /user/:username/ignoreof
 *      /user/:username/inbox
 *      /user/:username/outbox
 *      /user/:username/ignores/summary
 *      /user/:username/message/:messageid
 *      /user/:username/comments
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
 *      /user/:username/changepassword
 *      /user/:username/changeemail
 *      /user/:username/togglehtml
 *      /user/:username/personaldetails
 *      /user/:username/messages/read
 *      /user/:username/messages/unread
 *      /user/:username/messages/recipient/delete
 *      /user/:username/messages/recipient/undelete
 *      /user/:username/ban
 *      /user/:username/unban
 *      /user/:username/ping
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
        api.users.getUsers(_.extend(req.query || {}, {
            query: {
                startswith: req.query.startswith,
                email: req.query.email
            }
        }), function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/users/count', checkAuth, function(req, res, next){
        api.users.getUsers(_.extend(req.query, {
            countonly: true
        }), function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/users/summary', checkAuth, function(req, res, next){
        api.users.getUsers(_.extend(req.query, {
            summary: true,
            query: {
                startswith: req.query.startswith,
                email: req.query.email
            }
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
        api.users.getBuddies(_(req.query || {}).extend({
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
        api.users.getBuddies(_(req.query || {}).extend({
            query: {
                username: req.route.params.username
            },
            listkey: 'ignores'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/buddyof', checkAuth, function(req, res, next){
        api.users.getBuddyOf(_.extend({}, req.query, {
            query: {
                username: req.route.params.username
            },
            listkey: 'buddies'
        }), function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    app.get('/user/:username/ignoreof', checkAuth, function(req, res, next){
        api.users.getBuddyOf(_.extend({}, req.query, {
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
        api.users.getBuddies(_(req.query || {}).extend({
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
        api.users.getBuddies(_(req.query || {}).extend({
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

    app.get('/user/:username/comments', checkAuth, function(req, res, next){
        api.comments.getComments({
            query: {
                postedby: req.route.params.username
            },
            size: 10,
            sortBy: '-created',
            populate: true
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });

    // post
    // new user
    app.post('/user', checkAuth, function(req, res, next){
        var body = req.body;
console.log('route new user', body);
        api.users.addUser({
            query: {
                username: body.username,
                password: body.password,
                email: body.email,
                ip: body.ip || req.connection.remoteAddress
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

            if(user.banned){
                return res.send('User is banned', 403);
            }

            if(!req.body.password || !user.password || !bcrypt.compareSync(req.body.password, user.password)){
                return res.send('Invalid credentials', 401);
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


    // PUT
    // ping
    app.put('/user/:username/ping', checkAuth, function(req, res, next){
        api.users.ping({
            query: {
                username: req.route.params.username
            },
            ip: req.body.ip
        }, function(err, json){
            if(err) return next(err);
            res.send(json);
        });
    });
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
        var username = req.route.params.username;
        api.users.updateUserList({
            query: {
                username: username
            },
            listkey: 'buddies',
            listval: req.body.listval
        }, function(err, json){
            if(err) return next(err);

            api.users.updateUserList({
                query: {
                    username: username
                },
                listkey: 'ignores',
                listval: req.body.listval,
                removefromlist: true
            }, function(err, json){
                if(err) return next(err);

                res.send(json);
            });
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
        var username = req.route.params.username;
        api.users.updateUserList({
            query: {
                username: username
            },
            listkey: 'ignores',
            listval: req.body.listval
        }, function(err, json){
            if(err) return next(err);

            api.users.updateUserList({
                query: {
                    username: username
                },
                listkey: 'buddies',
                listval: req.body.listval,
                removefromlist: true
            }, function(err, json){
                if(err) return next(err);

                res.send(json);
            });
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
    // change password
    app.put('/user/:username/changepassword', checkAuth, function(req, res, next){
        var username = req.route.params.username,
            body = req.body;

        api.users.getUser({
            query: {username: username}
        }, function(err, user){
            if(err) return next(err);

            if(!body.password || !user.password || !bcrypt.compareSync(body.password, user.password)){
                return res.send({message: 'Invalid credentials'}, 401);
            }

            api.users.setPassword({
                query: {
                    username: user.username
                },
                password: body.new_password
            }, function(err, user){
                if(err) return next(err);

                res.send({
                    user: user
                });
            });
        });
    });
    // reset password
    app.put('/user/:username/resetpassword', checkAuth, function(req, res, next){
        var username = decodeURIComponent(req.route.params.username),
            body = req.body;

        api.users.getUser({
            query: {username: username}
        }, function(err, user){
            if(err) return next(err);

            if(!body.password){
                return res.send({message: 'Password is required'}, 401);
            }

            api.users.setPassword({
                query: {
                    username: user.username
                },
                password: body.password
            }, function(err, user){
                if(err) return next(err);

                res.send({
                    user: user
                });
            });
        });
    });
    // change email
    app.put('/user/:username/changeemail', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.setEmail({
            query: {
                username: req.route.params.username
            },
            email: body.email
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // toggle html
    app.put('/user/:username/togglehtml', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.toggleHTML({
            query: {
                username: req.route.params.username
            }
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // change personaldetails
    app.put('/user/:username/personaldetails', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.setPersonalDetails({
            query: {
                username: req.route.params.username
            },
            realname: body.realname,
            location: body.location,
            about: body.about
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // change websites
    app.put('/user/:username/websites', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.setWebsites({
            query: {
                username: req.route.params.username
            },
            websites: body.websites
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // change forum preferences
    app.put('/user/:username/preferences', checkAuth, function(req, res, next){
        var body = req.body;

        api.users.setForumPreferences({
            query: {
                username: req.route.params.username
            },
            custom_css: body.custom_css,
            custom_js: body.custom_js,
            random_titles: body.random_titles === 'true',
            hide_enemy_posts: body.hide_enemy_posts === 'true',
            fixed_chat_size: body.fixed_chat_size === 'true',
            thread_size: parseInt(body.thread_size, 10),
            comment_size: parseInt(body.comment_size, 10)
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // ban / unban
    app.put('/user/:username/ban', checkAuth, function(req, res, next){
        api.users.setBanned({
            query: {
                username: req.route.params.username
            },
            banned: true
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    app.put('/user/:username/unban', checkAuth, function(req, res, next){
        api.users.setBanned({
            query: {
                username: req.route.params.username
            },
            banned: false
        }, function(err, json){
            if(err) return next(err);

            res.send(json);
        });
    });
    // set points
    app.put('/user/:username/points', checkAuth, function(req, res, next){
        api.users.setPoints({
            query: {
                username: req.route.params.username
            },
            points: req.body.points
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