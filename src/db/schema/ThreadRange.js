var mongoose = require('mongoose'),
    ThreadRangeSchema = new mongoose.Schema({
        threadid: {type: String, ref: 'Thread'},
        skip: Number,
        limit: Number,
        start_date: Date,
        end_date: Date,
        partial: {type: Boolean, default: true}
    });


// needs to be selectable threadid and skip - compound index?
module.exports = ThreadRangeSchema;