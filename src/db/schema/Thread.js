var mongoose = require('mongoose'),
    ThreadSchema = new mongoose.Schema({
        name: String,
        postedby: String,
        categories: [String],
        created: Date,
        last_comment_by: String,
        last_comment_time: Date,
        nsfw: {type: Boolean, default: false},
        closed: {type: Boolean, default: false},
        deleted: {type: Boolean, default: false},
        comments: [{type: String, ref: 'Comment'}]
    });

module.exports = ThreadSchema;