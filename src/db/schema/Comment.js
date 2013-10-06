var mongoose = require('mongoose'),
    CommentSchema = new mongoose.Schema({
        threadid: {type: String, ref: 'Thread'},
        postedby: String,
        created: Date,
        edit_percent: Number,
        points: Number,
        content: String
    });

CommentSchema.index({threadid:  1});
CommentSchema.index({threadid: -1});
CommentSchema.index({created: -1});
CommentSchema.index({created: 1});

module.exports = CommentSchema;