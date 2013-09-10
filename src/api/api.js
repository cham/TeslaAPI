/*
 * Tesla API
 * provides a single interface to separate entities of the API
 */
var db = require('../db/db'),
    users = require('./users'),
    comments = require('./comments'),
    threads = require('./threads');

module.exports = {

    users: users(db),
    comments: comments(db),
    threads: threads(db)

};