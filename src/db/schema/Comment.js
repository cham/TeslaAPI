var mongoose = require('mongoose'),
    CommentSchema = new mongoose.Schema({
        postedby: String,
        created: Date,
        edit_percent: Number,
        points: Number,
        content: String
    });

module.exports = CommentSchema;