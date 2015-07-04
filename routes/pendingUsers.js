'use strict';
var api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){

    // get user
    app.get('/pendingusers', checkAuth, function(req, res, next){
        api.pendingUsers.getPendingUsers({
            query: {
                _id: req.query.id
            }
        }, function(err, pendingUsers){
            if(err){
                return next(err);
            }
            res.send({pendingUsers: pendingUsers});
        });
    });
    app.get('/pendingusers/count', checkAuth, function(req, res, next){
        api.pendingUsers.getPendingUsers({
            countonly: true
        }, function(err, json){
            if(err){
                return next(err);
            }
            res.send(json);
        });
    });
    app.get('/pendingusers/:id', checkAuth, function(req, res, next){
        api.pendingUsers.getPendingUsers({
            query: {
                _id: req.route.params.id
            }
        }, function(err, pendingUsers){
            if(err){
                return next(err);
            }
            res.send(pendingUsers[0]);
        });
    });

    // new user
    app.post('/pendingusers', checkAuth, function(req, res, next){
        var body = req.body;
console.log('route new pendinguser', body);
        api.pendingUsers.createPendingUser({
            query: {
                username: body.username,
                password: body.password,
                email: body.email,
                ip: body.ip,
                created: body.created,
                question1: body.question1,
                answer1: body.answer1,
                question2: body.question2,
                answer2: body.answer2,
                question3: body.question3,
                answer3: body.answer3,
                points: body.points
            }
        }, function(err, pendingUser){
            if(err){
                return next(err);
            }
            res.send(pendingUser);
        });
    });

    // edit question
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
    // edit pending user points
    app.put('/pendingusers/:id/points', checkAuth, function(req, res, next){
        var points = parseInt(req.body.numpoints, 10) || 1;
        var pointedBy = req.body.username;
        var id = req.route.params.id;

        api.users.spendPoint({
            query: {
                username: pointedBy
            }
        }, function(err){
            if(err){
                return next(err);
            }

            api.pendingUsers.addPoint({
                query: {
                    _id: id
                },
                numpoints: points
            }, function(err, pendingUsers){
                if(err){
                    return next(err);
                }

                res.send({pendingUsers: pendingUsers});
            });
        });
    });

    // delete user
    app.delete('/pendingusers/:id', checkAuth, function(req, res, next){
        api.pendingUsers.deletePendingUser({
            query: {
                _id: req.route.params.id
            }
        }, function(err){
            if(err){
                return next(err);
            }
            res.end();
        });
    });

};
