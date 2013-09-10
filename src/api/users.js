/*
 * Tesla api methods for accessing and manipulating user data
 */
var _ = require('underscore'),
    crypto = require('crypto');

function summaryMapping(dbdoc){
    return {
        username: dbdoc.username,
        comments_count: dbdoc.comments_count,
        threads_count: dbdoc.threads_count,
        points: dbdoc.points,
        lastpointusage: dbdoc.lastpointusage,
        view_html: dbdoc.view_html,
        last_login: dbdoc.last_login,
        hide_enemy_posts: dbdoc.hide_enemy_posts,
        timezone: dbdoc.timezone,
        random_titles: dbdoc.random_titles,
        banned: dbdoc.banned
    };
}
// function safe(dbdoc){
//     var unsafe = ['password'];
//     return _(dbdoc.toObject()).reduce(function(memo, val, key){
//         if(_(unsafe).indexOf(key) === -1){
//             memo[key] = val;
//         }
//         return memo;
//     },{});
// }

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