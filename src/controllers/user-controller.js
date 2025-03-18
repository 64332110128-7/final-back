const createError = require("../utils/createError");
const prisma = require("../config/prisma");
const userService = require("../services/user_service");

exports.getMe = (req, res, next) => {
    res.json(req.user);
  };

exports.getPlan = async (req, res, next) => {
    try {
      const { userId } = req.params;
  
      const plans = await prisma.plan.findMany({
        where: {
          userId: parseInt(userId),
        },
        include: {
          planDays: {
            include: {
              locations: {
                include: {
                  location: {
                    include: {
                      category: true,
                      locationImg: true,
                      locationScore: {
                        include: {
                          user: {
                            select: {
                              userId: true,
                              firstName: true,
                              lastName: true,
                              email: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
  
      res.json({ plans });
    } catch (err) {
      next(err);
    }
  };
  