const express = require("express");
const userRoutes = require("./../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

router.post("/register", userRoutes.register);
router.post("/logon", userRoutes.logon);
router.post("/logoff", jwtMiddleware, userRoutes.logoff);

module.exports = router;
