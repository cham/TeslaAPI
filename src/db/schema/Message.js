var mongoose = require('mongoose'),
    MessageSchema = new mongoose.Schema({
        recipient: String,
        sender: String,
        created: Date,
        read: {type: Boolean, default: false},
        content: String
    });

MessageSchema.index({created: -1});
MessageSchema.index({created: 1});

module.exports = MessageSchema;