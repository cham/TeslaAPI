var mongoose = require('mongoose'),
    MessageSchema = new mongoose.Schema({
        recipient: String,
        sender: String,
        created: Date,
        read: {type: Boolean, default: false},
        subject: String,
        content: String,
        recipient_deleted: {type: Boolean, default: false},
        sender_deleted: {type: Boolean, default: false}
    });

MessageSchema.index({created: -1});
MessageSchema.index({created: 1});

module.exports = MessageSchema;