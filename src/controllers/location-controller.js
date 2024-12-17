const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.getLocationsLanding = async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        category: true,
        locationImg: true,
        locationScore: true,
      },
    });
    if (!locations) {
      return createError(404, "Location not found");
    }
    res.json({ locations });
  } catch (err) {
    next(err);
  }
};
