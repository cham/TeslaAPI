/*
 * users routing
 *
 * PUT
 *      /points
 */
var _ = require('underscore');
var api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){

    // get message
    app.get('/questions', checkAuth, function(req, res, next){
        api.questions.getQuestions({
            query: {
                _id: req.query.id
            }
        }, function(err, questions){
            if(err){
                return next(err);
            }
            res.send({questions: questions});
        });
    });
    app.get('/questions/:id', checkAuth, function(req, res, next){
        api.questions.getQuestions({
            query: {
                _id: req.route.params.id
            }
        }, function(err, questions){
            if(err){
                return next(err);
            }
            res.send({question: questions[0]});
        });
    });

    app.get('/randomquestion', checkAuth, function(req, res, next){
        api.questions.randomQuestion(function(err, questions){
            if(err){
                return next(err);
            }
            res.send({question: questions[0]});
        });
    });

    // new message
    app.post('/questions', checkAuth, function(req, res, next){
        api.questions.createQuestion({
            query: {
                detail: req.body.detail
            }
        }, function(err, question){
            if(err){
                return next(err);
            }
            res.send({question: question});
        });
    });

    // edit message
    app.put('/questions/:id', checkAuth, function(req, res, next){
        var body = req.body;

        api.questions.editQuestion({
            query: {
                _id: req.route.params.id
            },
            detail: body.detail,
            enabled: body.enabled === 'true'
        }, function(err, question){
            if(err){
                return next(err);
            }
            res.send({question: question});
        });
    });

};
