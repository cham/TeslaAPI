/*
 * Tesla API
 * provides a single interface to separate entities of the API
 */
var db = require('../db/db'),
    users = require('./users'),
    comments = require('./comments'),
    threads = require('./threads'),
    threadsRange = require('./threadsRange'),
    messages = require('./messages');

module.exports = {

    users: users(db),
    comments: comments(db),
    threadsRange: threadsRange(db)
    messages: messages(db),
    threads: threads(db)

};
