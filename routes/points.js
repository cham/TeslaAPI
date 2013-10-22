/*
 * users routing
 *
 * PUT
 *      /points
 */
var _ = require('underscore'),
    api = require('../src/api/api');

function checkAuth(res, req, next){
    next();
}

module.exports = function routing(app){

    // read message
    app.put('/points', checkAuth, function(req, res, next){
        var points = parseInt(req.body.numpoints, 10) || 1,
            pointer = req.body.username,
            commentId = req.body.commentId;

        api.users.spendPoint({
            query: {
                username: pointer
            }
        }, function(err, user){
            if(err) return next(err);

            api.comments.addPoint({
                query: {
                    _id: commentId
                },
                numpoints: points
            }, function(err, comment){
                if(err) return next(err);

                api.users.addPoint({
                    query: {
                        username: comment.postedby
                    },
                    numpoints: points
                }, function(err, user){
                    if(err) return next(err);
                    
                    res.send(comment);
                });
            });
        });
    });
};