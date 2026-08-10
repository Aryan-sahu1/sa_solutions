
const express = require("express");
const { register,findAll, login ,verifyCompany, changePassword} = require("../controller/auth.controller"); 
const authMiddleware= require("../middleware/auth.middleware")
const router = express.Router();


router.post("/", register)
router.post("/login", login);
router.get("/list",findAll)
router.get("/verify-company", authMiddleware, verifyCompany)
router.put("/update-password",authMiddleware,changePassword)
module.exports = router
