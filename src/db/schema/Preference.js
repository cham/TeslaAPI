var mongoose = require('mongoose'),
    PreferenceSchema = new mongoose.Schema({
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
        comments: [{type: String, ref: 'Comment'}]
    });

module.exports = PreferenceSchema;