/*
 * Tesla ODM layer
 * mongoose / mongodb
 */
var mongoose = require('mongoose'),
    UserSchema = require('./schema/User'),
    CommentSchema = require('./schema/Comment'),
    ThreadSchema = require('./schema/Thread');
    
mongoose.connect('mongodb://localhost/tesladb');

module.exports = {
    user: mongoose.model('User', UserSchema),
    comment: mongoose.model('Comment', CommentSchema),
    thread: mongoose.model('Thread', ThreadSchema)
};