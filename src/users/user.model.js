const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    id: { type: String, unique: true, required: true },
    mobile: { type: String },
    hash: { type: String},
    enrollment: { type: String },
    otp: { type: String },
    name: { type: String },
    gender:{type:String},
    birthDate:{type:String},
    hobbies : [{type: String}],
    highSchoolId : {type : String},
    midSchoolId : {type : String},
    universityId : {type : String},
    isVerified:{type:Boolean,default:false},
    isNewUser:{type:Boolean,default:true},
    isPersonalInfo:{type:Boolean,default:false},
    profilePic: {
        data: {type:Buffer},
        contentType: {type:String }
    },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.hash;
    }
});

module.exports = mongoose.model('User', schema);