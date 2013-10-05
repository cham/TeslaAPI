var _ = require('underscore'),
    api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}
    
module.exports = function routing(app){
    
    // comment routes
    app.get('/comments', checkAuth, function(req, res, next){
        api.comments.getComments(req.route.params || {}, function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/comments/count', checkAuth, function(req, res, next){
        api.comments.getComments(_(req.route.params || {}).extend({
            countonly: true
        }), function(err, data){
            if(err){
                return next(err);
            }
            res.send(data);
        });
    });

    app.get('/comments/summary', checkAuth, function(req, res, next){
        api.comments.getComments(_(req.route.params || {}).extend({
            summary: true
        }), function(err, comments){
            if(err){
                return next(err);
            }
            res.send({
                comments: comments
            });
        });
    });

    app.get('/comment/:commentId', checkAuth, function(req, res, next){
        api.comments.getComments({
            query: {
                _id: req.route.params.commentId
            }
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send(comment[0]);
        });
    });

    app.get('/comment/:commentId/summary', checkAuth, function(req, res, next){
        api.comments.getComments({
            query: {
                _id: req.route.params.commentId,
            },
            summary: true
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send(comment[0]);
        });
    });

    app.put('/comment/:commentId', checkAuth, function(req, res, next){
        var body = req.body;

        api.comments.editComment({
            query: {
                _id: req.route.params.commentId,
                postedby: body.username
            },
            update: {
                content: body.content
            }
        }, function(err, comment){
            if(err) return next(err);

            res.send(comment);
        });
    });

};