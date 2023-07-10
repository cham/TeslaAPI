/*
 * Tesla api methods for accessing and manipulating user data
 */
var _ = require('underscore'),
    async = require('async'),
    messages = require('./messages'),
    queryBuilder = require('./queryBuilder');

function summaryMapping(user){
    return {
        username: user.username,
        urlname: user.urlname,
        comments_count: user.comments_count,
        threads_count: user.threads_count,
        points: user.points,
        lastpointusage: user.lastpointusage,
        view_html: user.view_html,
        last_login: user.last_login,
        timezone: user.timezone,
        random_titles: user.random_titles,
        banned: user.banned,
        created: user.created
    };
}

module.exports = function(db){
    var messagesApi = messages(db);

    return {
        getUsers: function(options, done){
            queryBuilder.buildOptions('read:users', options, function(err, cleanOptions){
                if(err) return done(err);

                var query = db.user
                    .find(cleanOptions.query);

                if(cleanOptions.countonly){
                    query.count(function (err, count) {
                        if (err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                    return;
                }

                // count now takes longer than query for users
                async.parallel({
                    totaldocs: function(asyncDone){
                        _(query).clone().count(function (err, count) {
                            if (err) return asyncDone(null, 0);

                            asyncDone(null, count);
                        });
                    },
                    users: function(asyncDone){
                        if(cleanOptions.sortBy){
                            query.sort(cleanOptions.sortBy);
                        }
                        if(cleanOptions.skip){
                            query.skip(cleanOptions.skip);
                        }
                        if(cleanOptions.limit){
                            query.limit(cleanOptions.limit);
                        }

                        query.exec(function(err, users){
                            if(err) return asyncDone(null, []);

                            if(!users || !users.length){
                                return asyncDone(null, []);
                            }
                            if(cleanOptions.summary){
                                users = _(users).map(summaryMapping);
                            }
                            asyncDone(null, users);
                        });
                    }
                }, function(err, results){
                    if(err) return done(err);

                    done(null,
                        {
                            users: cleanOptions.summary ? results.users.map(summaryMapping) : results.users,
                            skip: cleanOptions.skip,
                            limit: cleanOptions.limit,
                            totaldocs: results.totaldocs
                        }
                    );
                });
            });
        },

        getUser: function(options, done){
            queryBuilder.buildOptions('read:users', options, function(err, cleanOptions){
                if(err) return done(err);

                db.user
                    .findOne(cleanOptions.query)
                    .exec(function(err, user){
                        if(err) return done(err);
                        if(!user || !user.activated) return done(null,{});

                        var userData = cleanOptions.summary ? summaryMapping(user) : user;

                        done(null, userData);
                    });
            });
        },

        addUser: function(options, done){
            queryBuilder.buildOptions('write:users', options, function(err, cleanOptions){
                if(err) return done(err);
                var user = new db.user(cleanOptions.query);

                user.save(function(err){
                    if(err){
                        return done(err);
                    }

                    return done(null, user);
                });
            });
        },

        updateUserList: function(options, done){
            this.getUser(options, function(err, user){
                if(err) return done(err);

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    var key = cleanOptions.listkey,
                        val = cleanOptions.listval;

                    if(cleanOptions.removefromlist){
                        user[key] = _(user[key]).without(val);
                    }else{
                        if(_.isArray(user[key]) && user[key].indexOf(val) === -1){
                            user[key].push(val);
                        }
                    }

                    user.save(function(err){
                        if(err) return done(err);

                        return done(null, user);
                    });
                });
            });
        },

        getBuddies: function(options, done){
            var that = this,
                summary = !!options.summary,
                populate = !!options.populate,
                excludelist = !!options.excludelist,
                usersquery = options.usersquery;

            delete options.summary;
            delete options.populate;
            delete options.excludelist;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                var query,
                    arr = user[options.listkey];

                if(!arr.length){
                    return done(null, {
                        users: []
                    });
                }

                if(excludelist){
                    query = _(usersquery || {}).extend({
                        username: { $nin: arr }
                    });
                }else{
                    query = _(usersquery || {}).extend({
                        username: { $in: arr }
                    });
                }

                return that.getUsers({
                    query: query,
                    page: options.page,
                    size: options.size,
                    summary: summary,
                    populate: populate
                }, done);
            });
        },

        getBuddyOf: function(options, done){
            queryBuilder.buildOptions('read:users', options, function(err, cleanOptions){
                if(err) return done(err);

                var queryOptions = {},
                    query;

                queryOptions[cleanOptions.listkey] = cleanOptions.query.username;
                query = db.user.find(queryOptions);

                if(cleanOptions.countonly){
                    return query.count(function(err, count){
                        done(err, {totaldocs:count});
                    });
                }

                query.exec(done);
            });
        },

        ping: function(options, done){
            var ip = options.ip;
            delete options.ip;

            this.getUser({
                query: options.query
            }, function(err, user){
                if(err) return done(err);
                if(!user || !user.save) return done(new Error('user not found'));

                user.last_ip = ip;
                user.last_login = new Date();
                if(!user.known_ips){
                    user.known_ips = [];
                }
                if(user.known_ips.indexOf(ip) === -1){
                    user.known_ips.push(ip);
                }

                user.save(function(err){
                    if(err) return done(err);

                    messagesApi.getInboxSize(user.username, function(err, json){
                        if(err) return done(err);

                        var userData = user.toJSON();

                        if(json.totaldocs) userData.inbox = json.totaldocs;

                        done(null, userData);
                    });
                });
            });
        },

        spendPoint: function(options, done){
            var now = new Date(),
                timelimit = 1000 * 60 * 60 * 8;

            this.getUser(options, function(err, user){
                if(err) return next(err);
                if(!user) return next(new Error('user not found'));

                if(user.lastpointusage){
                    if((now.getTime() - user.lastpointusage.getTime()) < timelimit){
                        return done(new Error('lastpointusage less than ' + timelimit + 'ms ago'));
                    }
                }

                user.lastpointusage = now;

                user.save(function(err){
                    if(err) return done(err);

                    done(null, user);
                });
            });
        },

        addPoint: function(options, done){
            var numpoints = options.numpoints;

            this.getUser(options, function(err, user){
                if(err) return next(err);
                if(!user) return next(new Error('user not found'));

                user.points += numpoints;

                user.save(function(err){
                    if(err) return done(err);

                    done(null, user);
                });
            });
        },

        setPassword: function(options, done){
            var password = options.password;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                options.query.password = password;

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    user.password = cleanOptions.query.password;

                    user.save(function(err){
                        if(err) return done(err);
                        
                        done(null, user);
                    });
                });
            });
        },

        setEmail: function(options, done){
            var email = options.email;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                options.query.email = email;
                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    user.email = cleanOptions.query.email;
                    user.save(function(err){
                        if(err) return done(err);
                        done(null, user);
                    });
                });
            });
        },

        toggleHTML: function(options, done){
            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                user.view_html = !user.view_html;
                user.save(function(err){
                    if(err) return done(err);
                    done(null, user);
                });
            });
        },

        setPersonalDetails: function(options, done){
            var realname = options.realname,
                location = options.location,
                about = options.about;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    user.realname = realname;
                    user.location = location;
                    user.about = about;

                    user.save(function(err){
                        if(err) return done(err);

                        done(null, user);
                    });
                });
            });
        },

        setWebsites: function(options, done){
            var websites = options.websites;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    user.websites = _.reduce(websites, function(memo, val, key){
                        memo.push({
                            name: key,
                            url: val
                        });
                        return memo;
                    }, []);

                    user.save(function(err){
                        if(err) return done(err);

                        done(null, user);
                    });
                });
            });
        },

        setForumPreferences: function(options, done){
            var custom_css = options.custom_css,
                custom_js = options.custom_js,
                random_titles = options.random_titles,
                hide_enemy_posts = options.hide_enemy_posts,
                thread_size = options.thread_size,
                comment_size = options.comment_size,
                fixed_chat_size = options.fixed_chat_size;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    // booleans
                    user.random_titles = random_titles;
                    user.hide_enemy_posts = hide_enemy_posts;
                    user.fixed_chat_size = fixed_chat_size;
                    // numbers
                    user.thread_size = thread_size;
                    user.comment_size = comment_size;
                    // strings
                    user.custom_css = custom_css;
                    user.custom_js = custom_js;

                    user.save(function(err){
                        if(err) return done(err);

                        done(null, user);
                    });
                });
            });
        },

        setBanned: function(options, done){
            var banned = options.banned;

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    user.banned = banned;

                    user.save(function(err){
                        if(err) return done(err);

                        done(null, user);
                    });
                });
            });
        },

        setPoints: function(options, done){
            var points = parseInt(options.points);

            this.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                queryBuilder.buildOptions('update:users', options, function(err, cleanOptions){
                    if(err) return done(err);

                    if(isNaN(points)){
                        return done(new Error('points is not a number'));
                    }

                    user.points = points;

                    user.save(function(err){
                        if(err) return done(err);

                        done(null, user);
                    });
                });
            });
        },

        deleteUser: function(options, done){
            db.user
                .findOne({username: options.username})
                .remove(function(err, success){
                    if(err) return done(err);

                    done();
                });
        },

        deleteAllUsers: function(done){
            db.user
                .find()
                .remove(function(err){
                    if(err) return done(err);

                    done();
                });
        }
    };
};