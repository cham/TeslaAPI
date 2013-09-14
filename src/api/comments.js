/*
 * Tesla api methods for accessing and manipulating comment data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder');

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

                query.exec(function(err, comments){
                    if(err) return done(err);

                    if(!comments){
                        return done(null,{});
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

                    return done(null, comment);
                });
            });
        },
    };
};