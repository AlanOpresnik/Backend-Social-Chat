const express = require("express");
const router = express.Router();
const multer = require("multer");
const check = require("../midlewares/auth");
const UserController = require("../controllers/user");

//config de subida

 const storage = multer.diskStorage({
    destination: (req,file,cb) =>{
        cb(null, "./uploads/avatars")
    },
    filename: (req,file,cb) => {
        cb(null, "avatar-"+Date.now()+"-" +file.originalname)
    }
 })

 const uploads = multer({storage});

router.get("/prueba-user",check.auth, UserController.pruebaUser)
router.post("/register", UserController.register)
router.post("/login", UserController.login)
router.get("/profile/:id",check.auth, UserController.profile)
router.get("/list/:page?", check.auth, UserController.list)
router.put("/update", check.auth, UserController.update)
router.post("/upload", [check.auth, uploads.single("avatar")], UserController.upload)
router.get("/avatar/:file", check.auth, UserController.avatar)
router.get("/counters/:id", check.auth, UserController.counter)

module.exports = router