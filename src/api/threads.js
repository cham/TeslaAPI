/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore'),
    async = require('async'),
    queryBuilder = require('./queryBuilder'),
    comments = require('./comments'),
    users = require('./users');

function completeMapping(thread){
    return {
        _id: thread._id,
        created: thread.created,
        last_comment_by: thread.last_comment_by,
        last_comment_time: thread.last_comment_time,
        name: thread.name,
        urlname: thread.urlname,
        postedby: thread.postedby,
        numcomments: thread.numcomments,
        categories: thread.categories,
        deleted: thread.deleted,
        closed: thread.closed,
        nsfw: thread.nsfw
    };
}
function summaryMapping(thread){
    return {
        _id: thread._id,
        created: thread.created,
        last_comment_by: thread.last_comment_by,
        last_comment_time: thread.last_comment_time,
        name: thread.name,
        urlname: thread.urlname,
        postedby: thread.postedby,
        numcomments: thread.numcomments,
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
                    return query.count(function (err, count) {
                        if (err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                }

                // count now takes longer than query for users
                async.parallel({
                    totaldocs: function(asyncDone){
                        _(query).clone().count(function (err, count) {
                            if (err) return asyncDone(null, 0);

                            asyncDone(null, count);
                        });
                    },
                    threads: function(asyncDone){
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
                            if(err) return asyncDone(null, []);

                            if(!threads || !threads.length){
                                return asyncDone(null, []);
                            }
                            if(cleanOptions.summary){
                                threads = _(threads).map(summaryMapping);
                            }
                            asyncDone(null, threads);
                        });
                    }
                }, function(err, results){
                    if(err) return done(err);

                    done(null,
                        {
                            threads: results.threads,
                            skip: cleanOptions.skip,
                            limit: cleanOptions.limit,
                            totaldocs: results.totaldocs
                        }
                    );
                });
            });
        },

        // retrieves a single document, sorting is disabled, and paging is applied to the comments
        getThread: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err) return done(err);

                db.thread
                    .find(cleanOptions.query)
                    .limit(1)
                    .exec(function(err, threads){
                        if(err) return done(err);
                        if(!threads || !threads.length) return done(null, []);

                        if(!cleanOptions.populate){
                            return done(null, {
                                threads: threads,
                                skip: cleanOptions.skip,
                                limit: cleanOptions.limit,
                                totaldocs: threads[0].numcomments
                            });
                        }

                        commentsApi.getComments({
                            query: {
                                threadid: threads[0]._id
                            },
                            page: options.page,
                            size: options.size
                        }, function(err, comments){
                            if(err) return done(err);

                            var thread = completeMapping(threads[0]);

                            return done(null, {
                                threads: [_(thread).extend({comments: comments})],
                                skip: cleanOptions.skip,
                                limit: cleanOptions.limit,
                                totaldocs: thread.numcomments
                            });
                        });
                    });
            });
        },

        getParticipated: function(options, done){
            var that = this, // following vars to getThreads only - do not apply to getDistinct
                summary = !!options.summary,
                populate = !!options.populate,
                excludelist = !!options.excludelist,
                threadquery = options.threadquery,
                sortBy = options.sortBy;

            delete options.summary;
            delete options.populate;
            delete options.excludelist;
            delete options.sortBy;

            commentsApi.getDistinct({
                query: {
                    postedby: options.query.username
                },
                distinctkey: 'threadid'
            }, function(err, threadids){
                if(err) done(err);

                that.getThreads({
                    query: _(threadquery || {}).extend({
                        _id: { $in: threadids }
                    }),
                    page: options.page,
                    size: options.size,
                    summary: summary,
                    populate: populate,
                    sortBy: sortBy
                }, done);
            });
        },

        getThreadsInUserList: function(options, done){
            var that = this, // following vars to getThreads only - do not apply to getUser
                summary = !!options.summary,
                populate = !!options.populate,
                excludelist = !!options.excludelist,
                threadquery = options.threadquery,
                sortBy = options.sortBy;

            delete options.summary;
            delete options.populate;
            delete options.excludelist;
            delete options.sortBy;

            usersApi.getUser(options, function(err, user){
                if(err) return done(err);
                if(!user) return done(new Error('user not found'));

                var idClause = { $in: user[options.listkey] };

                if(excludelist){
                    idClause = { $nin: user[options.listkey] };
                }

                return that.getThreads({
                    query: _(threadquery || {}).extend({
                        _id: idClause
                    }),
                    page: options.page,
                    size: options.size,
                    summary: summary,
                    populate: populate,
                    sortBy: sortBy
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

                    if(!thread){
                        return done(new Error('could not create thread'));
                    }

                    user.threads_count = (user.threads_count || 0) + 1;
                    user.save();

                    return that.postCommentInThreadByUser({
                        query: {
                            threadid: thread._id,
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

        updateThread: function(options, done){
            var thread,
                optionKeys = Object.keys(options),
                closed = options.closed,
                nsfw = options.nsfw;

            this.getThread({
                query: {
                    urlname: options.query.urlname
                }
            }, function(err, json){
                if(err){
                    return done(err);
                }

                if(!json.threads || !json.threads.length){
                    return done(new Error('thread not found'));
                }
                thread = json.threads[0];
                if(optionKeys.indexOf('closed') > -1){
                    thread.closed = closed;
                }
                if(optionKeys.indexOf('nsfw') > -1){
                    thread.nsfw = nsfw;
                }

                thread.save(function(err){
                    if(err) return done(err);

                    return done(null, thread);
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
                if(err) return done(err);

                commentsApi.postComment({
                    query: {
                        threadid: cleanOptions.query.threadid,
                        postedby: cleanOptions.query.postedby,
                        content: cleanOptions.query.content
                    }
                }, function(err, comment){
                    if(err){
                        return done(err);
                    }

                    thread.last_comment_by = cleanOptions.query.postedby;
                    thread.last_comment_time = new Date();
                    thread.numcomments = (thread.numcomments || 0) + 1;

                    user.comments_count = (user.comments_count || 0) + 1;
                    user.save();

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
                            threadid: thread._id,
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