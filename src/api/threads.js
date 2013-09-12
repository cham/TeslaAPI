/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder'),
    comments = require('./comments');

function summaryMapping(thread){
    return {
        created: thread.created,
        last_comment_by: thread.last_comment_by,
        last_comment_time: thread.last_comment_time,
        name: thread.name,
        urlname: thread.urlname,
        postedby: thread.postedby,
        comments: thread.comments,
        deleted: thread.deleted,
        closed: thread.closed,
        nsfw: thread.nsfw,
        categories: thread.categories
    };
}

module.exports = function(db){
    var commentsApi = comments(db);
    return {
        getThreads: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var totaldocs,
                    query = db.thread.find(cleanOptions.query);

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

                var query = db.thread
                    .find(cleanOptions.query) //findOne not working here?
                    .limit(1);

                if(cleanOptions.skip || cleanOptions.limit){
                    query.slice('comments', [cleanOptions.skip || 0, cleanOptions.limit]);
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

                    done(null, threads);
                });
            });
        },

        postThread: function(options, done){
            var that = this;

            queryBuilder.buildOptions('write:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var thread = new db.thread(cleanOptions.query);

                return that.postCommentInThread({
                    query: {
                        postedby: options.query.postedby,
                        content: options.query.content
                    },
                    thread: thread,
                    returnthread: true
                }, done);
            });
        },

        postCommentInThread: function(options, done){
            var thread;

            options = options || {};
            if(!options.thread){
                done(new Error('thread is required'));
            }
            thread = options.thread;

            queryBuilder.buildOptions('write:comments', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                commentsApi.postComment({
                    postedby: cleanOptions.query.postedby,
                    content: cleanOptions.query.content
                }, function(err, comment){
                    if(err){
                        return done(err);
                    }

                    thread.comments.push(comment._id);
                    thread.save(function(err){
                        if(err){
                            return done(err);
                        }

                        return done(null, options.returnthread ? thread : comment);
                    });
                });
            });
        },

        postComment: function(options, done){
            var thread,
                that = this;

            this.getThread({
                query: {
                    _id: options.threadid
                }
            }, function(err, thread){
                if(err){
                    return done(err);
                }

                if(!thread){
                    return done(new Error('thread not found'));
                }
                if(thread.length){
                    thread = thread[0];
                }

                return that.postCommentInThread({
                    query: {
                        postedby: options.postedby,
                        content: options.content
                    },
                    thread: thread
                }, done);
            });
        }
    };
};