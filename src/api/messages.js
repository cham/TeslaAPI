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
                        if(err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                    return;
                }

                query.sort(cleanOptions.sortBy);

                query.exec(function(err, messages){
                    if(err) return done(err);

                    done(null,{
                        messages: messages
                    });
                });
            });
        },

        sendMessage: function(options, done){
            queryBuilder.buildOptions('write:messages', options, function(err, cleanOptions){
                if(err) return done(err);

                var message = new db.message(cleanOptions.query);

                message.save(function(err){
                    if(err) return done(err);

                    return done(null, message);
                });
            });
        },

        readMessage: function(options, done){
            this.getMessages(options, function(err, json){
                if(err) return done(err);
                if(!json.messages || !json.messages.length) return done();

                var message = json.messages[0];

                if(message.read) return done(null, message);

                message.read = true;

                message.save(function(err){
                    if(err) return done(err);

                    return done(null, message);
                });
            });
        },

        bulkUpdate: function(options, done){
            var mutatorFn = options.bulkaction;

            queryBuilder.buildOptions('update:messages', options, function(err, cleanOptions){
                if(err) return done(err);

                db.message.find(cleanOptions.query).exec(function(err, messages){
                    if(err) return done(err);

                    _(messages || []).each(function(message){
                        mutatorFn(message);
                        if(message.recipient_deleted && message.sender_deleted){
                            return message.remove();
                        }
                        message.save();
                    });

                    done(null, messages);
                });
            });
        },

        getInboxSize: function(username, done){
            this.getMessages({
                query: {
                    recipient: username,
                    recipient_deleted: false,
                    read: false
                },
                limit: 9999,
                countonly: true
            }, function(err, json){
                if(err) return done(err);

                done(null, json);
            });
        }
    };
};