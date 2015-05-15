/*
 * Tesla API
 * provides a single interface to separate entities of the API
 */
var db = require('../db/db');
var users = require('./users');
var comments = require('./comments');
var threads = require('./threads');
var threadsRange = require('./threadsRange');
var messages = require('./messages');
var questions = require('./questions');
var pendingUsers = require('./pendingUsers');

module.exports = {

    users: users(db),
    comments: comments(db),
    threadsRange: threadsRange(db),
    messages: messages(db),
    threads: threads(db),
    questions: questions(db),
    pendingUsers: pendingUsers(db)

};
