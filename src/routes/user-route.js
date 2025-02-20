const express = require("express");
const authenticate = require("../middlewares/authenticate");
const router = express.Router();
const userController = require("../controllers/user-controller")

router.get("/me", userController.getMe)
router.get("/:userId", userController.getPlan);

module.exports = router;