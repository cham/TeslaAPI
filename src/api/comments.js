/*
 * Tesla api methods for accessing and manipulating comment data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder'),
    threadsRange = require('./threadsRange'),
    users = require('./users'),
    bannedusers = require('./bannedusers'),
    Levenshtein = require('levenshtein');

function summaryMapping(comment){
    return {
        postedby: comment.postedby,
        created: comment.created,
        points: comment.points,
        content: comment.content,
        banned: comment.banned
    };
}

module.exports = function(db){

    var threadRangeApi = threadsRange(db);
    var bannedUsersCache = bannedusers(db);

    return {
        getComments: function(options, done){
            var mongooseObject = options.mongooseObject;

            queryBuilder.buildOptions('read:comments', options, function(err, cleanOptions){
                if(err) return done(err);

                var query = db.comment
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

                if(cleanOptions.sortBy){
                    query.sort(cleanOptions.sortBy);
                }
                if(cleanOptions.skip){
                    query.skip(cleanOptions.skip);
                }
                if(cleanOptions.limit){
                    query.limit(cleanOptions.limit);
                }
                if(cleanOptions.populate){
                    query.populate('threadid');
                }

                query.exec(function(err, comments){
                    var mappedComments;

                    if(err) return done(err);

                    if(!comments || !comments[0]){
                        return done(null,{});
                    }

                    if(mongooseObject){
                        mappedComments = comments;
                    }else{
                        mappedComments = comments.map(function(comment){
                            comment = comment.toJSON();
                            comment.banned = bannedUsersCache.getUsernames().indexOf(comment.postedby) > -1;
                            return comment;
                        });
                    }

                    if(!cleanOptions.query._id && cleanOptions.query.threadid && (_.isNumber(cleanOptions.skip) || _.isNumber(cleanOptions.limit))){
                        threadRangeApi.setRange({
                            threadid: cleanOptions.query.threadid,
                            skip: cleanOptions.skip,
                            limit: cleanOptions.limit,
                            start_date: comments[0].created,
                            end_date: comments[comments.length-1].created,
                            partial: comments.length < cleanOptions.limit,
                            length: comments.length
                        }, function(err){
                            if(err) return done(err);

                            done(null, cleanOptions.summary ? _(mappedComments).map(summaryMapping) : mappedComments);
                        });
                    }else{
                        done(null, cleanOptions.summary ? _(mappedComments).map(summaryMapping) : mappedComments);
                    }
                });
            });
        },

        postComment: function(options, done){
            queryBuilder.buildOptions('write:comments', options, function(err, cleanOptions){
                var comment = new db.comment(cleanOptions.query),
                    that = this;

                comment.save(function(err){
                    if(err) return done(err);

                    threadRangeApi.updatePartial({
                        threadid: cleanOptions.query.threadid
                    });

                    done(null, comment);
                });
            });
        },

        getDistinct: function(options, done){
            queryBuilder.buildOptions('read:comments', options, function(err, cleanOptions){
                if(err) return done(err);

                db.comment
                    .distinct(cleanOptions.distinctkey, cleanOptions.query)
                    .exec(function(err, values){
                        if(err) return done(err);

                        done(null, values);
                    });
            });
        },

        editComment: function(options, done){
            var update = options.update || {},
                content = update.content;

            this.getComments(_.extend(options, {
                mongooseObject: true
            }), function(err, comments){
                if(err) return done(err);

                if(!comments || !comments.length) return done(new Error('Comment not found'));
                var comment = comments[0],
                    longestContent = comment.content.length,
                    l;

                if(content.length > longestContent){
                    longestContent = content.length;
                }

                if(content){
                    l = new Levenshtein(comment.content, content);
                    comment.edit_percent += ((l.distance/longestContent)*100);
                    comment.content = content;
                }

                comment.save(function(err){
                    if(err) return done(err);

                    done(null, comment);
                });
            });
        },

        addPoint: function(options, done){
            var numpoints = options.numpoints,
                comment;

            this.getComments(_.extend(options, {
                mongooseObject: true
            }), function(err, comments){
                if(err) return done(err);
                if(!comments.length) return done(new Error('comment not found'));

                comment = comments[0];
                comment.points += numpoints;

                comment.save(function(err){
                    if(err) return done(err);

                    done(null, comment);
                });
            });
        }
    };
};