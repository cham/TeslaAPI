/*
 * Tesla api methods for accessing and manipulating user data
 */
var _ = require('underscore'),
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
        hide_enemy_posts: user.hide_enemy_posts,
        timezone: user.timezone,
        random_titles: user.random_titles,
        banned: user.banned
    };
}

module.exports = function(db){
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

                query.exec(function(err, users){
                    if(err){
                        return done(err);
                    }

                    done(null,{
                        users: cleanOptions.summary ? _(users).map(summaryMapping) : users
                    });
                });
            });
        },

        getUser: function(options, done){
            queryBuilder.buildOptions('read:users', options, function(err, cleanOptions){
                if(err) return done(err);

                db.user
                    .findOne(cleanOptions.query)
                    .exec(function(err, user){
                        if(err){
                            return done(err);
                        }

                        if(!user || !user.activated || user.banned){
                            return done(null,{});
                        }

                        done(null, cleanOptions.summary ? summaryMapping(user) : user);
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

        getUsersInUserList: function(options, done){
            var that = this, // following vars to getUsers only - do not apply to getUser
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
                    done(null, user);
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