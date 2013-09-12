var mongoose = require('mongoose'),
    PreferenceSchema = new mongoose.Schema({
        realname: String,
        location: String,
        description: String, 
        websites: [String],
        feeds: [String],
        flickr: String,
        facebook: String,
        aim: String,
        gchat: String,
        lastfm: String,
        msn: String,
        twitter: String
        fixedsize: Boolean,
        hideenemies: Boolean,


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