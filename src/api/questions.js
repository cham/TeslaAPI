'use strict';

var queryBuilder = require('./queryBuilder');

module.exports = function(db){
    return {
        getQuestions: function(options, done){
            queryBuilder.buildOptions('read:questions', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var query = db.questions.find(cleanOptions.query).sort('_id');

                if(cleanOptions.skip){
                    query.skip(cleanOptions.skip);
                }
                if(cleanOptions.limit){
                    query.limit(cleanOptions.limit);
                }

                query.exec(function(err, questions){
                    if(err){
                        return done(err);
                    }

                    done(null, questions);
                });
            });
        },

        randomQuestion: function(done){
            var questionsApi = this;

            db.questions.find({enabled: true}).count(function(err, count){
                if(err){
                    return done(err);
                }
                if(typeof count !== 'number' || count === 0){
                    return done(null, {});
                }

                questionsApi.getQuestions({
                    page: Math.ceil(Math.random() * count),
                    size: 1,
                    query: {
                        enabled: true
                    }
                }, function(err, questions){
                    if(err){
                        return done(err);
                    }

                    done(null, questions);
                });
            });
        },

        createQuestion: function(options, done){
            queryBuilder.buildOptions('write:questions', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var question = new db.questions(cleanOptions.query);

                question.save(function(err){
                    if(err){
                        return done(err);
                    }

                    done(null, question);
                });
            });
        },

        editQuestion: function(options, done){
            var detail = options.detail;
            var enabled = options.enabled;

            this.getQuestions(options, function(err, questions){
                if(err){
                    return done(err);
                }

                if(!questions || !questions.length){
                    return done(new Error('Comment not found'));
                }

                var question = questions[0];

                if(detail){
                    question.detail = detail;
                }
                if(enabled === true || enabled === false){
                    question.enabled = enabled;
                }

                question.save(function(err){
                    if(err){
                        return done(err);
                    }

                    done(null, question);
                });
            });
        }
    };
};
