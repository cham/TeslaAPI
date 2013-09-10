/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore'),
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
            var summary = !!options.summary;
            delete options.summary;

            db.thread
                .find(options)
                .exec(function(err, threads){
                    if(err){
                        return done(err);
                    }
                    if(!threads || !threads.length){
                        return done(null, []);
                    }

                    done(null,
                        summary ?
                            _(threads).map(summaryMapping)
                            :
                            threads
                    );
                });
        },

        getThreadsComplete: function(options, done){
            db.thread
                .find(options)
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
        },

        postThread: function(options, done){
            if(!options.postedby){
                done(new Error('postedby is required'));
            }
            var now = new Date(),
                thread = new db.thread({
                    name: options.name,
                    urlname: encodeURIComponent(options.name.replace(/(\s-|[^A-Za-z0-9-])/g,'-')),
                    postedby: options.postedby,
                    categories: options.categories || [],
                    created: now,
                    last_comment_by: options.postedby,
                    last_comment_time: now,
                    comments: []
                });

            return this.postCommentInThread({
                postedby: options.postedby,
                content: options.content,
                threadDoc: thread,
                returnthread: true
            }, done);
        },

        postCommentInThread: function(options, done){
            var threadDoc = options.threadDoc;

            commentsApi.postComment({
                postedby: options.postedby,
                content: options.content
            }, function(err, comment){
                if(err){
                    return done(err);
                }

                threadDoc.last_comment_by = options.postedby;
                threadDoc.last_comment_time = new Date();
                threadDoc.comments.push(comment._id);

                threadDoc.save(function(err){
                    if(err){
                        return done(err);
                    }

                    return done(null, options.returnthread ? threadDoc : comment);
                });
            });
        },

        postComment: function(options, done){
            var thread,
                that = this;

            this.getThreads({
                _id: options.threadid
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