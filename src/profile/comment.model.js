const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    postId: { type: String,  required: true },
    comment: { type: String,  required: true },
    commentedUser: { type: String ,  required: true},
    dateOfComment: { type: Date, default: Date.now },
    parentComment:{type: String},
    repliedComments:[{
        postId: { type: String,  required: true },
        comment: { type: String,  required: true },
        commentedUser: { type: String ,  required: true},
        dateOfComment: { type: Date, default: Date.now },
        parentComment:{type: String},
    }]
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Comment', schema);