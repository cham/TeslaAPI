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
                if(err){
                    return done(err);
                }

                db.user
                    .find(cleanOptions.query)
                    .exec(function(err, users){
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
                if(err){
                    return done(err);
                }

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
                if(err){
                    return done(err);
                }

                var user = new db.user(cleanOptions.query);

                user.save(function(err){
                    if(err){
                        return done(err);
                    }

                    return done(null, user);
                });
            });
        },

        deleteUser: function(options, done){
            db.user
                .findOne({username: options.username})
                .remove(function(err, success){
                    if(err){
                        return done(err);
                    }
                    done();
                });
        },

        deleteAllUsers: function(done){
            db.user
                .find()
                .remove(function(err){
                    if(err){
                        return done(err);
                    }
                    done();
                });
        }
    };
};