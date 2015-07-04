'use strict';

var queryBuilder = require('./queryBuilder');
var users = require('./users');
var async = require('async');

module.exports = function(db){
    var usersApi = users(db);

    return {
        getPendingUsers: function(options, done){
            queryBuilder.buildOptions('read:pendingusers', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var query = db.pendingUser.find(cleanOptions.query).sort('-created');

                if(cleanOptions.skip){
                    query.skip(cleanOptions.skip);
                }
                if(cleanOptions.limit){
                    query.limit(cleanOptions.limit);
                }
                if(cleanOptions.countonly){
                    return query.count(function(err, count){
                        done(err, {totaldocs:count});
                    });
                }

                query.exec(function(err, pendingUsers){
                    if(err){
                        return done(err);
                    }

                    async.parallel(
                        pendingUsers.map(function(pendingUser){
                            var pendingUserJson = pendingUser.toJSON();
                            return function(asyncDone){
                                usersApi.getUsers({
                                    query: {
                                        known_ips: pendingUser.ip
                                    }
                                }, function(err, json){
                                    if(err){
                                        return done(err);
                                    }
                                    if(json.users.length){
                                        pendingUserJson.accountsKnownOnIp = json.users.map(function(user){
                                            return user.username;
                                        });
                                    }
                                    asyncDone(null, pendingUserJson);
                                });
                            };
                        }),
                        done
                    );
                });
            });
        },

        createPendingUser: function(options, done){
            var module = this;

            queryBuilder.buildOptions('write:pendingusers', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }
console.log('api post-queryBuilder query', cleanOptions.query);

                usersApi.getUser({
                    query: {
                        username: cleanOptions.query.username
                    }
                }, function(err, user){
                    if(err){
                        return done(err);
                    }
                    if(user._id){
                        return done(new Error('username already registered'));
                    }

                    module.getPendingUsers({
                        query: {
                            ip: cleanOptions.query.ip
                        }
                    }, function(err, pendingUsersByIp){
                        if(err){
                            return done(err);
                        }

                        if(pendingUsersByIp && pendingUsersByIp.length){
                            return done(new Error('a pending user already exists for that ip'));
                        }

                        cleanOptions.query.created = new Date();
console.log('api new pendingUser', cleanOptions.query);

                        var pendingUser = new db.pendingUser(cleanOptions.query);

                        pendingUser.save(function(err){
                            if(err){
                                return done(err);
                            }

console.log('api saved pendingUser', pendingUser.toJSON());
                            done(null, pendingUser);
                        });
                    });
                });
            });
        },

        addPoint: function(options, done){
            var pointsToAdd = options.numpoints;

            queryBuilder.buildOptions('update:pendingusers', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var query = db.pendingUser.find(cleanOptions.query);
                query.exec(function(err, pendingUsers){
                    if(err){
                        return done(err);
                    }

                    if(!pendingUsers || !pendingUsers.length){
                        return done(new Error('pending user not found'));
                    }

                    var pendingUser = pendingUsers[0];

                    pendingUser.points += pointsToAdd;
                    pendingUser.save(function(err){
                        done(err, pendingUser);
                    });
                });
            });
        },

        deletePendingUser: function(options, done){
            if(!options.query || !options.query._id){
                return done(new Error('_id is required'));
            }

            db.pendingUser.findOne({_id: options.query._id}).remove(done);
        }
    };
};
