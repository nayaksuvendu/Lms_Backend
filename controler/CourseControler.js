const CourseDb = require('../model/CourseDb.js');
const AppError = require('../utillity/error.js');
const cloudinary = require('cloudinary');
const fs =require('fs/promises')

//CREATE COURSE
const createCourse=async(req,res,next)=>{
try {
    const{title, description, category, createdBy }= req.body
   console.log(description);
    if(!title|| !description || !category || !createdBy){
        return next(new AppError('all field required',400))
    }
    const course= await CourseDb.create({
        title, description, category, createdBy  
    })
    if(!course){
        return next(new AppError('course could not be created',400))   
    }
    if(req.file){
      const result= await cloudinary.v2.uploader.upload(req.file.path,{// provide path and specification
        folder:'lms',
        height:250,
        width:250,
        gravity:'faces', // for focous on face
        crop:'fill' // for image set perfectly
    }) 
    if(result){
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
    }
    fs.rm(`uploads/${req.file.filename}`); // after upload to cloudnary remove file from local
    }
    await course.save();
    res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course,
      });
} catch (error) {
    return next(new AppError(error.message,400))
}
}

//UPDATE COURSE
const updateCourse=async(req,res,next)=>{
  try {
    const newCourse= await CourseDb.findByIdAndUpdate(req.params.id,{$set:req.body},{
       runValidators:true // use to follow all courseDb validation
    }) 
    if(!newCourse){
        return next(new AppError('user not exsit',400))
    }
     await newCourse.save()
    res.status(200).json({
        success:true,
        message:'course updated successfully',
        newCourse
    })
    }                  
   catch (error) {
   return next(new AppError(error.message,400))
  }  
}

//REMOVE COURSE
const removeCourse = async(req,res,next)=>{
    try {
        const remove = CourseDb.findByIdAndDelete(req.params.id)
        if(!remove){
            return next(new AppError('Course with given id does not exist.',400))
        }   
        res.status(201).json({
            success: true,
            message: "Course successfully removed",
            remove
        }) 
    } catch (error) {
        return next(new AppError(error.message,400))
 
    }
}

//GET COURSE
const getAllDetails= async(_req,res,next)=>{
    try {
        const course= await CourseDb.find({}).select('-lectures') // get all course from CourseDb except lecture 
        res.status(200).json({
            success:true,
            message:'here all courses details',
            course
        })
    } catch (e) {
        return next(new AppError(e.message,400))
    }
}

//GET LECTURE
const getLectureByCourseId = async(req,res,next)=>{
    try {
        const{id} = req.params
        const course= await CourseDb.findById(id)
        if (!course) {
            return next(new AppError('Invalid course id or course not found.', 404));
          }
        res.status(200).json({
            success:true,
            message:'Course lectures fetched successfully',
            lectures:course.lectures
        })
    } catch (e) {
        return next(new AppError(e.message,400))
    }
}

//ADD LECTURE
const AddLecture = async(req,res,next)=>{
 const {title,description} = req.body;
 const {id} = req.params;
 console.log(id)
 if(!title || !description){
    return next(new AppError('All field require to file',400))
 }
 const course = await CourseDb.findById(id);
 if(!course){
    return next(new AppError('Invalid course id or course not found.',400))
 }
 let lecturesData = {} // declare all data inside lacture
    if(req.file){
        try{
        const result = await cloudinary.v2.uploader.upload(req.file.path,{// provide path and specification
         folder:'lms',
         chunk_size:50000000,//50 mb size
         resource_type:'video' })
      if(result){
             lecturesData.public_id = result.public_id;
             lecturesData.secure_url = result.secure_url;
      }
      fs.rm(`uploads/${req.file.filename}`); // after uploaded to cloudnary remove file from local server
      }
      catch(e){
            // Empty the uploads directory without deleting the uploads directory
            for (const file of await fs.readdir('uploads/')) {
                await fs.unlink(path.join('uploads/', file));
              }  
        return next(new AppError(e.message,400)) 
      }
   }
 course.lectures.push({title:title,
    description:description,
    lecture:lecturesData
    });
course.numberOfLectures = course.lectures.length;
 await course.save();

res.status(200).json({
    success: true,
    message: 'Course lecture added successfully',
    lecture : course.lectures
    });  
}

 // REMOVE LECTURE
const removeLectureFromCourse = async (req, res, next) => {
    // Grabbing the courseId and lectureId from req.query
    const { courseId,lectureId } = await req.query; // it get data from URL
   
    // Checking if both courseId and lectureId are present
    if (!courseId ) {
      return next(new AppError('Course ID is required', 400));
    }
  
    if (!lectureId) {
      return next(new AppError('Lecture ID is required', 400));
    }
  
    // Find the course uding the courseId
    const course = await CourseDb.findById(courseId);
  
    // If no course send custom message
    if (!course) {
      return next(new AppError('Invalid ID or Course does not exist.', 404));
    }
  
    // Find the index of the lecture using the lectureId
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );
  
    // If returned index is -1 then send error as mentioned below
    if (lectureIndex === -1) {
      return next(new AppError('Lecture does not exist.', 404));
    }
  
    // Delete the lecture from cloudinary
    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: 'video',
      }
    );
  
    // Remove the lecture from the array
    course.lectures.splice(lectureIndex, 1);
  
    // update the number of lectures based on lectres array length
    course.numberOfLectures = course.lectures.length;
  
    // Save the course object
    await course.save();
  
    // Return response
    res.status(200).json({
      success: true,
      message: 'Course lecture removed successfully',
    });
}    

 module.exports={getAllDetails,getLectureByCourseId,createCourse
  ,updateCourse,removeCourse,AddLecture,removeLectureFromCourse}