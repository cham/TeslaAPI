/*
 * Tesla api methods for accessing and manipulating comment data
 */
var _ = require('underscore');

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
            var summary = !!options.summary;
            delete options.summary;

            db.comment
                .find(options)
                .exec(function(err, comments){
                    if(err){
                        return done(err);
                    }
                    if(!comments){
                        return done(null,{});
                    }

                    done(null,
                        summary ?
                            _(comments).map(summaryMapping)
                            :
                            comments
                    );
                });
        },

        postComment: function(options, done){
            var now = new Date(),
                comment = new db.comment({
                    postedby: options.postedby,
                    created: now,
                    edit_percent: 0,
                    points: 0,
                    content: options.content
                }),
                that = this;

            comment.save(function(err){
                if(err){
                    return done(err);
                }

                return done(null, comment);
            });
        },
    };
};