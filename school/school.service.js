const { School} = require('../_helpers/db');
const db = require('../_helpers/db');
const SchoolList = db.SchoolList
const User = db.User
module.exports = {
    search,
    save,
    matchSameSchool,
    matchSameUniv,
    uploadImage
};

var schoolSearch = [
    { name: 'Choongang University', address: 'Dummy address for Choongang University'  },
    { name: 'Korea University', address: 'Dummy address for Korea University'  },
    { name: 'Seoul National University', address: 'Dummy address for Seoul National University'  },
    { name: 'Yonsei University', address: 'Dummy address for Yonsei University'  },
    { name: 'Sogang University', address: 'Dummy address for Sogang University'  },
    { name: 'Naksang High School', address: 'Dummy address for Naksang High School'  },
    { name: 'Bundang High School', address: 'Dummy address for Bundang High School'  },
    { name: 'Dolma High School', address: 'Dummy address for Dolma High School'  },
    { name: 'Emae High School', address: 'Dummy address for Emae High School'  },
    { name: 'Sunae High School', address: 'Dummy address for Sunae High School'  },
    { name: 'Seohyun Middle School', address: 'Dummy address for Seohyun Middle School'  },
    { name: 'Cheongsol Middle School', address: 'Dummy address for Cheongsol Middle School'  },
    { name: 'Yatab Middle School', address: 'Dummy address for Yatab Middle School'  },
    { name: 'Bulgok Middle School', address: 'Dummy address for Bulgok Middle School'  },
    { name: 'Beckhyun Middle School', address: 'Dummy address for Beckhyun Middle School'  }
];

function returnResponse(status,message){
    return {
        status:status,
        message:message
    }
}

async function search(res,{id,searchString}){

    const user = await User.findOne({ id });
    if (user) {
        const isUniversityChosen = user.universityId?true:false;
        const isHighSchoolChosen = user.highSchoolId?true:false;
        const isMidSchoolChosen = user.midSchoolId?true:false;
         SchoolList.find({name:{$regex:searchString,$options:'i'}}, function (err, docs) {
            console.log("docs => ",docs);
            if(err){
                return {
                    status:'fail',
                    message:err
                }
            }else{
                res.status(200).json({
                    isSchoolChosen:{
                        isUniversityChosen:isUniversityChosen,
                        isHighSchoolChosen:isHighSchoolChosen,
                        isMidSchoolChosen:isMidSchoolChosen
                    },
                    schools:docs
                })
            }
        });
    }else{
        return {
            status : "fail",
            message : "user not found for the given id : " + id
        }
    }
    // if(school){
    //     for(let school in schools){
            
    //     }
    //     return {
    //         schools:school
    //     }
    // }else{
    //     return {
    //         schools:'err'
    //     }
    // }
    // School.find(
    //     { "name": { "$regex": searchString , "$options": "i" } },
    //     function(err,docs) { 
    //         if(err){
    //             return {
    //                 status : err.error
    //             }
    //         }else{
    //             return {
    //                 ...docs.toJSON()
    //             }
    //         }
    //     }

    // );
}

async function save(schoolParam){
    console.log("schoolparam=>",schoolParam);
    if(schoolParam.schoolType === 'high'){
        return savehighSchoolInfo(schoolParam);
    }else if (schoolParam.schoolType === 'mid'){
        return savemidSchoolInfo(schoolParam);
    }else if(schoolParam.schoolType === 'university'){
        return saveUnivInfo(schoolParam);
    }else{
        return {
            status : "fail",
            message:"required param school type missing,unable to  save info"
        }
    }
}

async function savehighSchoolInfo({id, schoolName,enrollment, yearOfEntrance , schoolType}){
    const user = await User.findOne({ id });
    if (user) {
        if(user.highSchoolId){
            return { 
                status:"fail",
                message:"High School Info has already been saved for the user , with verification status :  " + user.highSchoolVerificationStatus
            }
        }else{
            const school = new School({
                userId:id,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
            });
            if (school) {
                await school.save();
                Object.assign(user,{highSchoolId:school._id,highSchoolVerificationStatus:"Pending"});
                await user.save();
                return{
                    status:"success",
                    message:"successfully saved the school Info"
                }
            }else{
                return{
                    status:"fail",
                    message:"unable to save school info, please try again"
                }
            }
        }
    }else{
        return{
            status:"fail",
            message:"user not found for the given id : " + id
        }
    }
}

async function savemidSchoolInfo({id, schoolName,enrollment, yearOfEntrance , schoolType}){

    const user = await User.findOne({ id });
    if (user) {
        if(user.midSchoolId){
            return { 
                status:"fail",
                message:"Mid School Info has already been saved for the user , with verification status :  " + user.midSchoolVerificationStatus
            }
        }else{
            const school = new School({
                userId:id,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
            });
            if (school) {
                await school.save();
                Object.assign(user,{midSchoolId:school._id,midSchoolVerificationStatus:"Pending"});
                await user.save();
                return{
                    status:"success",
                    message:"successfully saved the school Info"
                }
            }else{
                return{
                    status:"fail",
                    message:"unable to save school info, please try again"
                }
            }
        }
    }else{
        return{
            status:"fail",
            message:"user not found for the given id : " + id
        }
    }
}

async function saveUnivInfo({id, schoolName,enrollment, yearOfEntrance, department , schoolType}){

    const user = await User.findOne({ id });
    if (user) {
        if(user.universityId){
            return { 
                status:"fail",
                message:"University Info has already been saved for the user , with verification status :  " + user.universityVerificationStatus
            }
        }else{
            const school = new School({
                userId:id,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
                department:department
            });
            if (school) {
                await school.save();
                Object.assign(user,{universityId:school._id,universityVerificationStatus:"Pending"});
                await user.save();
                return { 
                    status:"success",
                    message:"successfully saved the school Info"
                }
            }else{
                return { 
                    status:"fail",
                    message:"unable to save school info, please try again"
                }
            }
        }
    }else{
        return {
            status:"fail",
            message:"user not found for the given id : " + id
        }
    }
}

// async function saveUnivInfo(univParam){
    
//     const univ = await School.findOne({ id });
//     if (univ) {
//         Object.assign(univ,univParam);
//         await univ.save();
//     }else{
//         const newUniv = new School(univParam);
//         await newUniv.save();
//     }
//     return {
//         status : "successfully saved the university Info"
//     }
// }

async function matchSameSchool({schoolName}){

    School.find({name: schoolName}, function(err, docs) {

        if(err){
            return {
                status : err.error
            }
        }else{
            // Map the docs into an array of just the ids of the user
            var ids = docs.map(function(doc) { return doc.id; });
        
            // Get the users whose ids are in the set
            User.find({id: {$in: ids}}, function(err, docs) {
                
                if(err){
                    return {
                        status : err.error
                    }
                }else{
                    return {
                        users : docs.map(function(doc){
                            return {
                                id:doc.id,
                                name:doc.name
                            }
                        })
                    }
                }

            });
        }
    });
}

async function matchSameUniv(res,{universityName}){

    var result;
     School.find({name: universityName , schoolType:"university"}, function(err, docs) {
        console.log("school=>",docs);
        if(err){
            return {
                status : "fail",
                message:err.error
            }
        }else{
            // Map the docs into an array of just the ids of the user
            var ids = docs.map(function(doc) { return doc.userId; });
        
            // Get the users whose ids are in the set
            return User.find({id: {$in: ids}}, function(err, docs) {
                console.log("users=>",docs);
                if(err){
                    return {
                        status : err.error
                    }
                }else{
                    res.status(200).json({
                        users:docs.map(function(doc){
                            return {
                                id:doc.id,
                                name:doc.name
                            };
                        })
                    })
                }

            });
        }
    });
}

async function uploadImage({ id }){

    const imgFilePath = __dirname +'/uploads/'+id+'/';
    var imageData = fs.readFileSync(imgFilePath);
    
    // Create an Image instance
    const image = new Image({
      type: 'image/png',
      data: imageData
    });

    image.save()
    .then(img => {

      Image.findById(img, (err, findOutImage) => {
        if (err) throw err;
        try{
          fs.writeFileSync( imgFilePath, findOutImage.data);
          console.log("Stored an image to mongo.");
        }catch(e){
          console.log(e);
        }
      });
    }).catch(err => {
      console.log(err);
      throw err;
    });

    //remove file after uploading to mongo
    fs.unlink(imgFilePath, (err) => {
        if (err) throw err;
        console.log(imgFilePath + ' was deleted');
      });
    
}

// async function getAll() {
//     return await User.find();
// }

// async function getById(id) {
//     return await User.findById(id);
// }

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