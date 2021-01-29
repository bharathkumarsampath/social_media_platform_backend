﻿const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
var springedge = require('springedge');
const User = db.User;
const UserVerification = db.UserVerification
const globals = require('../globals')

module.exports = {
    requestOTP,
    resendOTP,
    validateOTP,
    login,
    saveInfo,
    getById,
    getHobbies,
    saveHobbies,
    isIdAvailable,
    savePersonalInfo,
    requestVerification,
    getVerificationRequest,
    respondVerificationRequest
};

async function respondVerificationRequest({id, requestById, school, status}){
    const userVerification = await UserVerification.findOne({
        requestBy:requestById,
        requestTo:requestToId,
        school:school
    })
    //add code to make sure the status sent from user is either of the approve/decline/pass
    if(userVerification){
        Object.assign(userVerification,{status:status});
        await userVerification.save(function(err, user) {
            if (err) {
                console.log(err);
                return {
                    status:"fail",
                    message:"Error while updating the status , Error : " + err
                }
            }
            return {
                status:"success",
                message:"status updated"
            }
        });
    }else{
        return {
            status:"fail",
            message:"There is no request with the given combination"
        }
    }
}

async function requestVerification({requestById, requestToId, school}){
    const userVerification = await UserVerification.findOne({
        requestBy:requestById,
        requestTo:requestToId,
        school:school
    })
    if(userVerification){
        return{
            status:"fail",
            message:"Request is already placed and the status is : " + userVerification.status
        }
    }
    userVerification = new UserVerification({
        requestBy:requestById,
        requestTo:requestToId,
        school:school
    });
    await userVerification.save(function(err, user) {
        if (err) {
            console.log(err);
            return {
                status:"fail",
                message:"Error while placing the request , Error : " + err
            }
        }
        return {
            status:"success",
            message:"Request placed successfully"
        }
    });

}

async function getVerificationRequest({id}){
    
    const user = await User.findOne({id});
    if(!user){
        return {
            status:"fail",
            message:"Unable to find user with the given id : " + id
        }
    }
    return UserVerification.find({requestToId:id},function(err,docs){
        if(err){
            return {
                status:'fail',
                message:err
            }
        }else{
            return {
                users:docs
            }
        }
    })
}

async function sendOTP(res,user,userParam){

    var generatedOTP = Math.floor(100000 + Math.random() * 900000);
    Object.assign(user,{otp:generatedOTP,mobile:userParam.mobile});
    await user.save();

    //demo test credentials from springedge
    var params = {
        'apikey': '6mj40q3t7o89qz93cn0aytz8itxg6641', // API Key
        'sender': 'SEDEMO', // Sender Name
        'to': [
            user.mobile //Moblie Number
        ],
        'message': 'Hi, this is a test message from spring edge',
        'format': 'json'
        };
        
        springedge.messages.send(params, 5000, function (err, response) {
        
            if (response.status) {
                console.log("response=> ",response);
                res.status(200).json({
                    status:"success",
                    message:"successfully sent the OTP",
                    OtpDetails:response
                });
            }else{
                console.log("error => ",response.error);
                res.status(200).json({
                    status:"fail",
                    message:"Unable to send OTP",
                    OtpDetails:response
                });
            }
        })
        
}





async function requestOTP(res,userParam) {
    // validate
    const user = await User.findOne({ id: userParam.id })
    const koreanPhoneRegex = new RegExp(globals.koreanMobileRegex);
    if(koreanPhoneRegex.test(userParam.mobile)){
        if (user) {
            //sendOTP
            return sendOTP(res,user,userParam);
        }else{
             throw 'User not found with the given id, please signup before requesting OTP';
        }
    }else{
        // return {
        //     status:"fail",
        //     message:"mobile is not in the format of korean phone number"
        // }
        throw "mobile is not in the format of korean phone number"
    }
    

}

async function resendOTP(res,userParam) {
    
    const user  =  await User.findOne({ id: userParam.id});
    
    if (user) {
        return sendOTP(res,user,userParam);
    }else{
        res.status(200).json({
            status:"fail",
            messsage:"user with given id not found , id : " + userParam.id
        });
    }

}

async function validateOTP({otp,id}) {

    const user = await User.findOne({ id });
    if (user) {
        if (otp === user.otp){
            return {
                status : "match",
                message:"Successfully verified OTP",
            }
        }else{
            return {
                status : "mismatch",
                message:"OTP does not match,please try again"
            }
        }
    }else{
        throw 'user with given id "' + id + '" not found';
    }

}

async function login({ id, password }) {
    
    const user = await User.findOne({ id });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' });
        return {
            status : "success",
            message : "successfully found the user" ,
            token
        };
    }else{
        return {
            status : "fail",
            message : "user id or password is incorrect"
        }
    }
}

async function saveInfo({id , password}){

    const user = await User.findOne({id});
    if(user){
        return {
            status : "fail",
            message:"user already signed up with the id : " + id
        }
    }else{
        var hash = bcrypt.hashSync(password, 10);
        const newUser = new User({id : id, hash:hash});
        await newUser.save();
        const token = jwt.sign({ sub: id }, config.secret, { expiresIn: '7d' });
        return {
            status : "success",
            message : "New password created successfully",
            token:token
        };
    }
}

var hobbies = [
    { name: 'Traveler' },
    { name: 'Painter' },
    { name: 'Poker Player'  },
    { name: 'Chess Player' },
    { name: 'Football Fan'},
    { name: 'Console Gamer'  },
    { name: 'Environmentalist'  },
    { name: 'gourmet' },
];

async function getHobbies({ id }) {

    const user = await User.findOne({id});
   
    if(user){
        var oldHobbies = user.hobbies;
        if(oldHobbies.length > 0){
            var newHobbies = hobbies.filter(n => !oldHobbies.includes(n));
            return {
                hobbies:newHobbies
            }
        }else{
            return {
                hobbies:hobbies
            }
        }
    }else{
        return {
            status : "user not found for the provided id : " + id
        }
    }
}

async function saveHobbies({ id , hobbies}) {
    
    const user = await User.findOne({id});
   
    if(user){
        var oldHobbies = user.hobbies;
        if(oldHobbies.length > 0){
            var newHobbies = oldHobbies.concat(hobbies);
            Object.assign(user,{hobbies:newHobbies});
        }else{
            Object.assign(user,{hobbies:hobbies});
        }
        await user.save();
    }else{
        return {
            status : "user not found for the provided id : " + id
        }
    }
}

async function isIdAvailable({id}){
    const user = await User.findOne({id});

    if(user){
        return {
            status:"fail",
            message:"Id already taken, please choose another id"
        }
    }
    else{
        return {
            status:"success",
            message:"Id is available"
        }
    }
}

async function savePersonalInfo({id,name,gender,birthDate}){

    const user = await User.findOne({id});

    if(user){
        Object.assign(user,{name:name,gender:gender,birthDate:birthDate});
        await user.save();
        return {
            status:"success",
            message:"personal info saved successfully"
        }
    }
    else{
        return {
            status:"fail",
            message:"user with the id " + id + " doest not exist"
        }
    }

}

// async function getAll() {
//     return await User.find();
// }

async function getById(id) {
    const user = await User.findById(id);
    console.log("getById => ", id , user);
}

// async function update(id, userParam) {
//     const user = await User.findById(id);

//     // validate
//     if (!user) throw 'User not found';
//     if (user.id !== userParam.id && await User.findOne({ id: userParam.id })) {
//         throw 'Username "' + userParam.id + '" is already taken';
//     }

//     // hash password if it was entered
//     if (userParam.password) {
//         userParam.hash = bcrypt.hashSync(userParam.password, 10);
//     }

//     // copy userParam properties to user
//     Object.assign(user, userParam);

//     await user.save();
// }

// async function _delete(id) {
//     await User.findByIdAndRemove(id);
// }


// hash password
// if (userParam.password) {
//     user.hash = bcrypt.hashSync(userParam.password, 10);
// }