/*
 * Tesla api methods for accessing and manipulating comment data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder'),
    pagingMutator = require('./pagingMutator'),
    Levenshtein = require('levenshtein');

function summaryMapping(comment){
    return {
        postedby: comment.postedby,
        created: comment.created,
        points: comment.points,
        content: comment.content
    };
}

module.exports = function(db){
    return {
        getComments: function(options, done){
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

                query.exec(function(err, comments){
                    if(err) return done(err);

                    if(!comments || !comments[0]){
                        return done(null,{});
                    }

                    if(cleanOptions.skip){
                        pagingMutator.setRangeStart(cleanOptions, comments[0].created);
                    }
                    if(comments.length === cleanOptions.limit){
                        pagingMutator.setRangeEnd(cleanOptions, comments[comments.length-1].created);
                    }

                    done(null, cleanOptions.summary ? _(comments).map(summaryMapping) : comments);
                });
            });
        },

        postComment: function(options, done){
            queryBuilder.buildOptions('write:comments', options, function(err, cleanOptions){
                var comment = new db.comment(cleanOptions.query),
                    that = this;

                comment.save(function(err){
                    if(err){
                        return done(err);
                    }

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

            this.getComments(options, function(err, comments){
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
        }
    };
};