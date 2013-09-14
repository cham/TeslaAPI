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

var testthread = {
        _id: '52343e0881f2730000000004',
        urlname: 'new-thred-ok',
        username: 'cham'
    };

// current yay stats
// users: 2875
// comments: 1073586
// threads: 25714

module.exports = {
    routing: function(app){
        app.get('/stresstarget', this.newcomment);
        app.get('/stresstest', this.runner);
    },
    runner: function(req, res, next){
        var loadtest = nl.run({
            host: 'localhost',
            port: 3000,
            timeLimit: 5*60,
            targetRps: 500,
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
                content: randomString('', 750),
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
    }
};