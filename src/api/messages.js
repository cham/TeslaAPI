/*
 * Tesla api methods for accessing and manipulating message data
 */
var _ = require('underscore'),
    queryBuilder = require('./queryBuilder');

module.exports = function(db){
    return {
        getMessages: function(options, done){
            queryBuilder.buildOptions('read:messages', options, function(err, cleanOptions){
                if(err) return done(err);

                var query = db.message.find(cleanOptions.query);

                if(cleanOptions.countonly){
                    query.count(function (err, count) {
                        if (err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                    return;
                }

                query.exec(function(err, messages){
                    if(err) return done(err);

                    done(null,{
                        messages: messages
                    });
                });
            });
        }
    };
};