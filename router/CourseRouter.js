const express = require('express');
const router=express.Router();
const upload=require('../midleware/multer.midleware.js')
const {isLoggedin,authorizedRole,authorizeSubscribers} = require('../midleware/auth.midleware.js');
const{getAllDetails,getLectureByCourseId,createCourse,
    updateCourse,removeCourse,AddLecture,removeLectureFromCourse} = require('../controler/CourseControler.js')
 
// new style router defined
router.route('/')
.get(getAllDetails)
.post(isLoggedin,authorizedRole('ADMIN'),upload.single('thumbnail'),createCourse)
.delete(isLoggedin,authorizedRole('ADMIN'),removeLectureFromCourse);

router.route('/:id')
.get(isLoggedin,authorizeSubscribers,getLectureByCourseId)
// Added authorizeSubscribers to check if user is admin or subscribed 
// if not then forbid the access to the lectures
.post(isLoggedin,authorizedRole('ADMIN'),upload.single('lecture'),AddLecture)
.put(isLoggedin,authorizedRole('ADMIN'),updateCourse)
.delete(isLoggedin,authorizedRole('ADMIN'),removeCourse);

 module.exports = router;
