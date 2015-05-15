var mongoose = require('mongoose');
var PendingUserSchema = new mongoose.Schema({
    username: {type: String, index: {unique: true, dropDups: true}},
    password: String,
    email: String,
    ip: String,
    created: Date,
    question1: String,
    answer1: String,
    question2: String,
    answer2: String,
    question3: String,
    answer3: String,
    points: {type: Number, default: 0}
});

module.exports = PendingUserSchema;