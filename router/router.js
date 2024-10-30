const express = require('express')
const router = express.Router();
const multer=require('multer')

const templateController=require('../controller/templateController')
const loginController=require('../controller/authController') 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Define routes
router.post('/upload', upload.single('file'), templateController.uploadFile);
router.get('/files_list', templateController.getFiles);


router.post('/sign_up',loginController.userSignUp)

router.post('/log_in',loginController.userLogIn)

module.exports= router