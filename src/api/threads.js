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

                db.thread
                    .find(cleanOptions.query)
                    .sort(cleanOptions.sortBy)
                    .exec(function(err, threads){
                        if(err){
                            return done(err);
                        }
                        if(!threads || !threads.length){
                            return done(null, []);
                        }

                        done(null,
                            cleanOptions.summary ?
                                _(threads).map(summaryMapping)
                                :
                                threads
                        );
                    });
            });
        },

        getThreadsComplete: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                db.thread
                    .find(cleanOptions.query)
                    .sort(cleanOptions.sortBy)
                    .populate('comments')
                    .exec(function(err, threads){
                        if(err){
                            return done(err);
                        }
                        if(!threads || !threads.length){
                            return done(null, []);
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
                    threadDoc: thread,
                    returnthread: true
                }, done);
            });
        },

        postCommentInThread: function(options, done){
            queryBuilder.buildOptions('write:comments', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var threadDoc = options.threadDoc;

                commentsApi.postComment({
                    postedby: cleanOptions.query.postedby,
                    content: cleanOptions.query.content
                }, function(err, comment){
                    if(err){
                        return done(err);
                    }

                    threadDoc.comments.push(comment._id);
                    threadDoc.save(function(err){
                        if(err){
                            return done(err);
                        }

                        return done(null, options.returnthread ? options.threadDoc : comment);
                    });
                });
            });
        },

        postComment: function(options, done){
            var thread,
                that = this;

            this.getThreads({
                query: {
                    _id: options.threadid
                }
            }, function(err, threads){
                if(err){
                    return done(err);
                }
                if(!threads || !threads.length){
                    return done(new Error('thread not found'));
                }

                return that.postCommentInThread({
                    postedby: options.postedby,
                    content: options.content,
                    threadDoc: threads[0]
                }, done);
            });
        }
    };
};