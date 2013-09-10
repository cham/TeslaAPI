/*
 * Tesla api methods for accessing and manipulating user data
 */
var _ = require('underscore'),
    crypto = require('crypto');

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
            var summary = options.summary;
            delete options.summary;

            db.user
                .find()
                .exec(function(err, users){
                    if(err){
                        return done(err);
                    }

                    done(null,{
                        'users':
                            summary ?
                                _(users).map(summaryMapping)
                                :
                                users
                    });
                });
        },

        getUser: function(options, done){
            db.user
                .findOne({username: options.username})
                .exec(function(err, user){
                    if(err){
                        return done(err);
                    }

                    if(!user || !user.activated || user.banned){
                        return done(null,{});
                    }

                    done(null,
                        options.summary ?
                            summaryMapping(user)
                            :
                            user
                    );
                });
        },

        addUser: function(options, done){
            var now = new Date(),
                user = new db.user({
                    username: options.username,
                    urlname: encodeURIComponent(options.username),
                    password: crypto
                                .createHash("md5")
                                .update(options.password)
                                .digest("hex"),
                    email: options.email,
                    last_ip: options.ip,
                    last_login: now,
                    created: now,
                    modified: now
                });

            user.save(function(err){
                if(err){
                    return done(err);
                }

                return done(null, user);
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