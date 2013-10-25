/*
 * stressTester
 * stress testing and database population for Tesla API
 * specify the test you would like to run in the routing method
 *   stresstarget is the rest to run - feel free to change to any of the tests
 *   stresstest is the test runner - you shouldn't need to change this
 * set your stresstarget, then GET /stresstest
 * an HTML file will appear in your project root with the test results
 */

var nl = require('nodeload'),
    api = require('./api/api');

function fuzzy(min, max){
    return Math.floor(Math.random()*(max-min)) + min;
}
function randomString(memo, length){
    var num = Math.floor(Math.random()*17);
    length--;
    if(num === 16){
        memo += ' ';
    }else{
        memo += num.toString(16);
    }
    if(length){
        return randomString(memo, length);
    }
    return memo;
}
function bonusContent(memo, length){
    var str = randomString(memo, length),
        position = Math.floor(Math.random() * length);

    if(Math.random()<0.3){
        return [
            str.slice(0, position),
            '<img src="http://placekitten.com/'+fuzzy(300, 700)+'/'+fuzzy(200, 450)+'">',
            str.slice(position)
        ].join(' ');
    }

    return str;
}

var testthread = {
        _id: '5259e08dedffc2ef1f000077',
        urlname: 'Spambot-thread',
        username: 'spambot'
    },
    postuser,
    postthread;

api.users.getUser({
    query: {
        username: testthread.username
    }
}, function(err, user){
    if(err) return done(err);
    postuser = user;
});

api.threads.getThread({
    query: {
        urlname: testthread.urlname
    }
}, function(err, thread){
    if(err) return done(err);
    postthread = thread.threads[0];
});

// current yay stats
// users: 2875
// comments: 1073586
// threads: 25714

module.exports = {
    routing: function(app){
        app.get('/stresstarget', this.fastcomment);
        app.get('/stresstest', this.runner);
    },
    runner: function(req, res, next){
        var loadtest = nl.run({
            host: 'localhost',
            port: 3000,
            timeLimit: 60*60,
            targetRps: 100,
            requestGenerator: function(client){
                var request = client.request('GET', "/stresstarget?_=" + Math.floor(Math.random()*100000000));
                request.end();
                return request;
            }
        });
        loadtest.on('end', function() { console.log('Load test done.'); });
    },

    // tests
    newcomment: function(req, res, next){
        api.threads.postComment({
            query: {
                postedby: testthread.username,
                content: bonusContent('', Math.floor(Math.random()*750)),
                threadid: testthread._id
            }
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send({
                comment: comment
            });
        });
    },

    newthread: function(req, res, next){
        var possibleCategories = ['Discussions','Advice','Projects','Meaningless'];
        api.threads.postThread({
            query: {
                name: randomString('', Math.floor(Math.random()*50)),
                postedby: testthread.username,
                categories: possibleCategories[Math.floor(Math.random()*4)],
                content: bonusContent('', Math.floor(Math.random()*750))
            }
        }, function(err, data){
            if(err){
                res.status(500);
                return res.send({
                    msg: err.toString()
                });
            }
            res.send(data);
        });
    },

    fastcomment: function(req, res, next){
        api.threads.postCommentInThreadByUser({
            query: {
                threadid: testthread._id,
                postedby: testthread.username,
                content: bonusContent('', Math.floor(Math.random()*750))
            },
            user: postuser,
            thread: postthread
        }, function(err, comment){
            if(err){
                return next(err);
            }
            res.send({
                comment: comment
            });
        });
    },

    randomcomment: function(req, res, next){
        api.threads.getThreads({
            countonly: true
        }, function(err, data){
            if(err) return next(err);

            var i = Math.floor(Math.random() * data.totaldocs);

            api.threads.getThreads({
                size: 1,
                page: i
            }, function(err, json){
                if(err) return next(err);

                api.threads.postCommentInThreadByUser({
                    query: {
                        threadid: json.threads[0]._id,
                        postedby: testthread.username,
                        content: bonusContent('', Math.floor(Math.random()*750))
                    },
                    user: postuser,
                    thread: json.threads[0]
                }, function(err, comment){
                    if(err) return next(err);

                    res.send({
                        comment: comment
                    });
                });
            });
        });
    }
};