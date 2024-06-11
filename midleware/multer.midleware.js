const path=require('path');

const multer=require('multer'); // convert binary image file that comes from client to original image file

  const upload = multer({
  dest: "uploads/", // img upload to this file
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 mb in size max limit
  storage : multer.diskStorage({
    destination: 'uploads/',
    filename: (_req, file, cb) => {
      cb(null, file.originalname); // cb= callback
    },
  }),

  fileFilter: (_req, file, cb) => {
    let ext = path.extname(file.originalname);

    if (
      ext !== ".jpg" &&
      ext !== ".jpeg" &&
      ext !== ".webp" &&
      ext !== ".png" &&
      ext !== '.mp4'
    ) {
      cb(new Error(`Unsupported file type! ${ext}`), false);
      return;
    }
    else{
    cb(null, true);
    }
  },
});

module.exports = upload

