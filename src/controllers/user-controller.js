const createError = require("../utils/createError");
const prisma = require("../config/prisma");
const userService = require("../services/user_service");

exports.getMe = (req, res, next) => {
    res.json(req.user);
  };