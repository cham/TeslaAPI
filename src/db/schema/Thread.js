var mongoose = require('mongoose'),
    ThreadSchema = new mongoose.Schema({
        name: String,
        urlname: {type: String, index: {unique: true, dropDups: true}},
        postedby: String,
        categories: [String],
        created: Date,
        last_comment_by: String,
        last_comment_time: Date,
        nsfw: Boolean,
        closed: Boolean,
        deleted: Boolean,
        numcomments: {type: Number, default: 0},
        points: Number
    });

ThreadSchema.index({last_comment_time: -1});

module.exports = ThreadSchema;