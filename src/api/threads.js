/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder'),
    comments = require('./comments'),
    users = require('./users');

function summaryMapping(thread){
    return {
        created: thread.created,
        last_comment_by: thread.last_comment_by,
        last_comment_time: thread.last_comment_time,
        name: thread.name,
        urlname: thread.urlname,
        postedby: thread.postedby,
        comments: {length: thread.comments.length},
        deleted: thread.deleted,
        closed: thread.closed,
        nsfw: thread.nsfw,
        categories: thread.categories
    };
}

module.exports = function(db){
    var commentsApi = comments(db),
        usersApi = users(db);

    return {
        getThreads: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var totaldocs,
                    query = db.thread.find(cleanOptions.query);

                if(cleanOptions.countonly){
                    query.count(function (err, count) {
                        if (err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                    return;
                }

                _(query).clone().count(function (err, count) {
                    if (err) return done(err);
                    totaldocs = count;
                });

                if(cleanOptions.sortBy){
                    query.sort(cleanOptions.sortBy);
                }
                if(cleanOptions.skip){
                    query.skip(cleanOptions.skip);
                }
                if(cleanOptions.limit){
                    query.limit(cleanOptions.limit);
                }

                // population only below here
                if(cleanOptions.populate){
                    query.populate('comments');
                }

                query.exec(function(err, threads){
                    if(err){
                        return done(err);
                    }
                    if(!threads || !threads.length){
                        return done(null, []);
                    }
                    if(cleanOptions.summary){
                        threads = _(threads).map(summaryMapping);
                    }

                    done(null,
                        {
                            threads: threads,
                            skip: cleanOptions.skip,
                            limit: cleanOptions.limit,
                            totaldocs: totaldocs
                        }
                    );
                });
            });
        },

        // retrieves a single document, sorting is disabled, and paging is applied to the comments
        getThread: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var totaldocs = 0,
                    query = db.thread
                    .find(cleanOptions.query) //findOne not working here?
                    .limit(1);

                _(query).clone().exec(function(err, threads){
                    if(err) return done(err);
                    if(!threads || !threads.length){
                        return done(null, []);
                    }

                    totaldocs = threads[0].comments.length;

                    if(cleanOptions.skip || cleanOptions.limit){
                        query.slice('comments', [cleanOptions.skip || 0, cleanOptions.limit]);
                    }

                    // population only below here
                    if(cleanOptions.populate){
                        query.populate('comments');
                    }

                    query.exec(function(err, threads){
                        if(err) return done(err);

                        if(cleanOptions.summary){
                            threads = _(threads).map(summaryMapping);
                        }

                        done(null,
                            {
                                threads: threads,
                                skip: cleanOptions.skip,
                                limit: cleanOptions.limit,
                                totaldocs: totaldocs
                            });
                    });
                });
            });
        },

        getParticipated: function(options, done){
            var that = this,
                summary = !!options.summary; // pass to getThreads only

            delete options.summary;

            usersApi.getUser(options, function(err, user){
                if(err) return done(err);

                if(!user) return done(new Error('user not found'));

                return that.getThreads({
                    query: {
                        _id: { $in: user.participated }
                    },
                    summary: summary
                }, done);
            });
        },

        postThread: function(options, done){
            var that = this;

            usersApi.getUser({
                query: {
                    username: options.query.postedby
                }
            }, function(err, user){
                if(err) return done(err);

                queryBuilder.buildOptions('write:threads', options, function(err, cleanOptions){
                    if(err){
                        return done(err);
                    }

                    var thread = new db.thread(cleanOptions.query);

                    return that.postCommentInThreadByUser({
                        query: {
                            postedby: options.query.postedby,
                            content: options.query.content
                        },
                        user: user,
                        thread: thread,
                        returnthread: true
                    }, done);
                });
                
            });
        },

        postCommentInThreadByUser: function(options, done){
            options = options || {};
            if(!options.thread){
                done(new Error('thread is required'));
            }
            if(!options.user){
                done(new Error('user is required'));
            }
            
            var thread = options.thread,
                user = options.user;

            queryBuilder.buildOptions('write:comments', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                commentsApi.postComment({
                    query: {
                        postedby: cleanOptions.query.postedby,
                        content: cleanOptions.query.content
                    }
                }, function(err, comment){
                    if(err){
                        return done(err);
                    }

                    thread.last_comment_by = cleanOptions.query.postedby;
                    thread.last_comment_time = new Date();
                    thread.comments.push(comment._id);

                    if(user.participated.indexOf(thread._id) === -1){
                        user.participated.push(thread._id);
                        user.save();
                    }

                    thread.save(function(err){
                        if(err) return done(err);

                        return done(null, options.returnthread ? thread : comment);
                    });
                });
            });
        },

        postComment: function(options, done){
            var thread,
                that = this;

            usersApi.getUser({
                query: {
                    username: options.query.postedby
                }
            }, function(err, user){
                if(err) return done(err);
                
                that.getThread({
                    query: {
                        _id: options.query.threadid
                    }
                }, function(err, json){
                    if(err){
                        return done(err);
                    }

                    if(!json.threads || !json.threads.length){
                        return done(new Error('thread not found'));
                    }
                    thread = json.threads[0];

                    return that.postCommentInThreadByUser({
                        query: {
                            postedby: options.query.postedby,
                            content: options.query.content
                        },
                        user: user,
                        thread: thread
                    }, done);
                });
            });
        }
    };
};