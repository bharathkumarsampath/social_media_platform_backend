const { reject } = require('lodash');
const { School, Hobby, UserVerification} = require('../../_helpers/db');
const db = require('../../_helpers/db');
const SchoolList = db.SchoolList
const User = db.User
module.exports = {
    search,
    save,
    matchSameSchool,
    matchSameUniv,
    uploadImage,
    getById,
    updateSchool,
    deleteSchool,
    updateSchoolStatus,
    cancelSchool
};

async function cancelSchool({schoolId}){
    const school = await School.findOne({_id:schoolId})
    if(!school){
        return{
            status:"fail",
            message:"unable to find the school with the given school id : " + schoolId
        }
    }
    if(school.verificationStatus !== "Pending"){
        return{
            status:"fail",
            message:"School sticker cannot be cancelled when the status is in : " + school.verificationStatus
        }
    }
    Object.assign(school,{verificationStatus:"Cancelled"})
    return new Promise((resolve)=>{
        school.save()
        .then(school=>{
            resolve({
                status:"success",
                message:"successfully cancelled the school sticker : "
            })
        })
        .catch(err=>{
            resolve({
                status:"fail",
                message:"Error while cancelling the school sticker : " + err.message
            })
        })
    })
}

async function updateSchoolStatus({schoolName,userId}){
    const school =  await  School.findOne({name:schoolName,userId:userId})
    return new Promise((resolve) => {
    
                if(school){
                    console.log("inside school")
                    if(school.verificationStatus === "Staged"){
                        Object.assign(school,{verificationStatus:"Pending"})
                    }else{
                        Object.assign(school,{verificationStatus:"Staged"})
                    }
                    school.save()
                        .then((school)=>{
                            resolve({
                                    status:"success",
                                    message:" successfully changed school status to " + school.verificationStatus  
                                
                            })
                        }).catch((error)=>{
                            resolve({
                                    status:"fail",
                                    message:" error while updating school status to "
                                     + school.verificationStatus  + " : " + error.message
                                
                            })
                        });
                }else{
                    console.log("else school")
                    resolve({
                            status:"fail",
                            message:" error while updating school status to  : " 
                             + "unable to find school for given user and school"
                        
                    })
                
                }
            })
}

async function deleteSchool({userId,schoolId,schoolType}){
    return new Promise((resolve) => {
        let unset
        if(schoolType === 'mid'){
            unset = {$unset:{midSchoolId:1}}
        }else if(schoolType === 'high'){
            unset = {$unset:{highSchoolId:1}}
        }else if(schoolType === 'university'){
            unset = {$unset:{universityId:1}}
        }else{
            resolve({
                status:"fail",
                message:"provided school type is not valid : " + schoolType
            })
        }
        User.updateOne({id:userId},unset,function(err){
            if(err){
                resolve({
                    status:"fail",
                    message:"Unable to remove the school sticker : "+err.message
                })
            }
            School.deleteOne({_id:schoolId},function(err,doc){
                if(err){
                    resolve({
                        status:"fail",
                        message:"unable to remove the school sticker ," + err.message
                    })
                }else{
                    resolve({
                        status:"success",
                        message:"successfully removed the school sticker"
                    })  
                    
                }
            })
        })
        
    })
}

async function updateSchool({enrollment,schoolId,yearOfEntrance,department}){
    const school = await School.findOne({_id:schoolId})
    return new Promise((resolve) => {
    
        let update = {}
        if(department){
            update = {
                ...update,
                department:department
            }
        }
        if(enrollment){
            update = {
                ...update,
                enrollment:enrollment
            }
        }
        if(yearOfEntrance){
            update = {
                ...update,
                yearOfEntrance:yearOfEntrance
            }
        }
        if(school){
            if(school.verificationStatus !== "Pending"){
                Object.assign(school,update)
                school.save()
                .then((school)=>{
                    resolve( {
                        status:"success",
                        message:"successfully updated the school info"
                    })
                }).catch((error)=>{
                    resolve( {
                        status:"fail",
                        message:error.message
                    })
                });
            }else{
                resolve( {
                    status:"fail",
                    message:"Updating school info is not allowed in Pending stage"
                })
            }
        }else{
            resolve( {
                status:"fail",
                message:"Unable to find school with the id , "+schoolId
            })
        }
})
}

async function search({userId,searchString}){

    console.log("searchString",searchString)

    const user = await User.findOne({ id:userId });
        if (user) {
            console.log(user);
        }else{
            return {
                status : "fail",
                message : "user not found for the given id : " + userId
            }
        }

    return new Promise((resolve, reject) => {
        
            SchoolList.find({name:{$regex:searchString,$options:'i'}}, function (err, docs) {
                console.log("docs => ",docs);
                if(err){
                    reject({
                        status:'fail',
                        message:err
                    })
                }else{
                    resolve({
                        status : "success",
                        isSchoolChosen:{
                            isUniversityChosen:user.universityId?true:false,
                            isHighSchoolChosen:user.highSchoolId?true:false,
                            isMidSchoolChosen:user.midSchoolId?true:false
                        },
                        schools:docs
                    })
                }
            });
        
      })
}

async function getById({id}){
    const school = await SchoolList.findOne({_id:id});
    if(school){
        return {
            status:"success",
            school:school
        }
    }else{
        return{
            status:"fail",
            message:"school with the given id not found , id : "+id
        }
    }
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

async function savehighSchoolInfo({userId, schoolName,enrollment, yearOfEntrance , schoolType}){
    console.log(userId, schoolName,enrollment,yearOfEntrance,schoolType)
    const user = await User.findOne({ id : userId});
    if (user) {
        if(user.highSchoolId){
            return { 
                status:"success",
                message:"High School Info has already been saved for the user   ",
                id:user.highSchoolId
            }
        }else{
            const school = new School({
                userId:userId,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
            });
            if (school) {
                await school.save();
                Object.assign(user,{highSchoolId:school._id});
                await user.save();
                return{
                    status:"success",
                    message:"successfully saved the school Info",
                    id:school._id
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
            message:"user not found for the given id : " + userId
        }
    }
}

async function savemidSchoolInfo({userId, schoolName,enrollment, yearOfEntrance , schoolType}){

    const user = await User.findOne({ id :userId});
    if (user) {
        if(user.midSchoolId){
            return { 
                status:"success",
                message:"Mid School Info has already been saved for the user ",
                id:user.midSchoolId
            }
        }else{
            const school = new School({
                userId:userId,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
            });
            if (school) {
                await school.save();
                Object.assign(user,{midSchoolId:school._id});
                await user.save();
                return{
                    status:"success",
                    message:"successfully saved the school Info",
                    id:school._id
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
            message:"user not found for the given id : " + userId
        }
    }
}

async function saveUnivInfo({userId, schoolName,enrollment, yearOfEntrance, department , schoolType}){

    console.log(userId, schoolName,enrollment,yearOfEntrance,schoolType)
    const user = await User.findOne({ id :userId});
    if (user) {
        if(user.universityId){
            return { 
                status:"success",
                message:"University Info has already been saved for the user " ,
                id:user.universityId
            }
        }else{
            const school = new School({
                userId:userId,
                name:schoolName,
                schoolType:schoolType,
                enrollment:enrollment,
                yearOfEntrance:yearOfEntrance,
                department:department
            });
            if (school) {
                return new Promise((resolve, reject) => {
                 school.save()
                .then((schoolDoc)=>{
                    console.log("newly created school doc=>",schoolDoc)
                    Object.assign(user,{universityId:schoolDoc._id});
                     user.save()
                    .then((user)=>{
                        resolve( { 
                            status:"success",
                            message:"successfully saved the school Info",
                            id:schoolDoc._id
                        })
                    })
                    .catch(error=>{
                        reject( { 
                            status:"fail",
                            message:"Error while saving the school Info : " + error.message
                        })
                    })
                })
                    // User.findOneAndUpdate({id:userId},{universityId:schoolDoc._id},function(err) {
                    //     if (err) {
                    //         // await School.deleteOne({_id:schoolDoc._id})
                    //         return { 
                    //             status:"fail",
                    //             message:"Error while saving the school Info : " + err.message
                    //         }
                    //     }
                    //     return { 
                    //         status:"success",
                    //         message:"successfully saved the school Info"
                    //     }
                    // })
                })
                .catch(error=>{
                    reject( { 
                        status:"fail",
                        message:"Error while saving the school Info : " + error.message
                    })
                })
                
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
            message:"user not found for the given id : " + userId
        }
    }
}

async function matchSameSchool({userId,schoolType,yearOfEntrance,schoolName}){

    const user = await User.findOne({id:userId})
        if(!user){
            return {
                status:"fail",
                message:"unable to find user for the given id : " + userId
            }
        }
    var searchCondition,schoolId
    if(schoolType === "high"){
                searchCondition =   { schoolType:"high" } 
                schoolId = user.highSchoolId
    }else if(schoolType === "mid"){
            searchCondition =   { schoolType:"mid" }
            schoolId = user.midSchoolId
    }else{
        return{
            status:"fail",
            message:"school type is not valid , please check the school type : "+schoolType
        }
    }
    let schoolResponse = await new Promise((resolve) => {

        School.find({ $and: [
            {name: schoolName},
            searchCondition ,
            {yearOfEntrance: yearOfEntrance},
            // {userId:{$ne:userId}}         
        ]},
            function(err, docs) {
            console.log("school=>",docs);
            if(err){
                resolve( {
                    status : "fail",
                    message:err
                })
            }else{
                // Map the docs into an array of just the ids of the user
                var ids = docs.map(function(doc) { return doc.userId; });
                resolve({
                    status:"success",
                    ids:ids
                })
                
            }
        });
      })
      if(schoolResponse.status === "fail"){
          return schoolResponse
      }

      var excludeUsers = []
      if(schoolId){
            const excludeUsersRes =  await new Promise((resolve)=>{
                UserVerification.find({school:schoolId},function(err,docs){
                    if(err){
                        resolve({
                            status : "fail",
                            message:err
                        })
                    }else{
                        excludeUsers = docs.map(function(doc) { return doc.requestTo; });
                        resolve({
                            status:"success"
                        })
                    }
                    
                })
            })
            if(excludeUsersRes.status!==undefined && excludeUsersRes.status === "fail"){
                return excludeUsersRes
            }
        }

        // Get the users whose ids are in the set
        return new Promise((resolve)=>{
            User.find({id: {$in: schoolResponse.ids,$nin: excludeUsers}}, function(err, docs) {
                console.log("users=>",docs);
                if(err){
                    resolve( {
                        status : "fail",
                        message:err
                    })
                }else{
                    resolve({
                        status : "success",
                        users:docs.map(function(doc){
                            return {
                                id:doc.id,
                                name:doc.name,
                                schoolName:schoolName,
                                photo:doc.profilePic
                            } 
                        })
                    })
                }
            });
        })
}

async function matchSameUniv({userId,yearOfEntrance,schoolName,department}){

        const user = await User.findOne({id:userId})
        if(!user){
            return {
                status:"fail",
                message:"unable to find user for the given id : " + userId
            }
        }
        const schoolId = user.universityId
        let schoolResponse = await new Promise((resolve) => {
            School.find({name: schoolName ,
                schoolType:"university",
                department:department,
                yearOfEntrance:yearOfEntrance,
                userId:{$ne:userId}
               },
               function(err, docs) {
                    console.log("school=>",docs);
                    if(err){
                        resolve( {
                            status : "fail",
                            message:err
                        })
                    }else{
                        // Map the docs into an array of just the ids of the user
                        var ids = docs.map(function(doc) { return doc.userId; });
                        resolve({
                            status:"success",
                            ids:ids
                        })
                        
                    }
                });
          })
          if(schoolResponse.status === "fail"){
              return schoolResponse
          }
    
          var excludeUsers = []
          if(schoolId){
                const excludeUsersRes =  await new Promise((resolve)=>{
                    UserVerification.find({school:schoolId},function(err,docs){
                        if(err){
                            resolve({
                                status : "fail",
                                message:err
                            })
                        }else{
                            excludeUsers = docs.map(function(doc) { return doc.requestTo; });
                            resolve({
                                status:"success"
                            })
                        }
                        
                    })
                })
                if(excludeUsersRes.status!==undefined && excludeUsersRes.status === "fail"){
                    return excludeUsersRes
                }
            }
    
            // Get the users whose ids are in the set
            return new Promise((resolve)=>{
                User.find({id: {$in: schoolResponse.ids,$nin: excludeUsers}}, function(err, docs) {
                    console.log("users=>",docs);
                    if(err){
                        resolve( {
                            status : "fail",
                            message:err
                        })
                    }else{
                        resolve({
                            status : "success",
                            users:docs.map(function(doc){
                                return {
                                    id:doc.id,
                                    name:doc.name,
                                    schoolName:schoolName,
                                    photo:doc.profilePic
                                } 
                            })
                        })
                    }
                });
            })

        School.find({name: schoolName ,
                     schoolType:"university",
                     department:department,
                     yearOfEntrance:yearOfEntrance,
                     userId:{$ne:userId}
                    }, function(err, docs) {
            console.log("school=>",docs);
            if(err){
                reject( {
                    status : "fail",
                    message:err
                })
            }else{
                // Map the docs into an array of just the ids of the user
                var ids = docs.map(function(doc) { return doc.userId; });
            
                // Get the users whose ids are in the set
                User.find({id: {$in: ids}}, function(err, docs) {
                    console.log("users=>",docs);
                    if(err){
                        reject( {
                            status : "fail",
                            message:err
                        })
                    }else{
                        resolve({
                                status : "success",
                                users:docs.map(function(doc){
                                    return {
                                        id:doc.id,
                                        name:doc.name,
                                        schoolName:schoolName,
                                        photo:doc.profilePic
                                    } 
                            })
                        })

                    }
    
                });
            }
        });
      

     
}

async function uploadImage({ id }){

    const imgFilePath = process.cwd() +'\\assets\\Images\\'+id;
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