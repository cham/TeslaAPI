'use strict';
var mongoose = require('mongoose');

var QuestionSchema = new mongoose.Schema({
    detail: String,
    enabled: Boolean
});

module.exports = QuestionSchema;
