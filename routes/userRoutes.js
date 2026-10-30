const express = require("express");
const userRoutes = require("./../controllers/userController");
const router = express.Router();

router.post("/register", userRoutes.register);
router.post("/logon", userRoutes.logon);
router.post("/logoff", userRoutes.logoff);

module.exports = router;
