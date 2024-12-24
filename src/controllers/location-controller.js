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

exports.getLocationsById = async (req, res, next) => {
  try {
    const {locationId} = req.params;
    const location = await prisma.location.findFirst({
      where: {
        locationId: Number(locationId),
      },
      include: {
        category: true,
        locationImg: true,
        locationScore: true,
      },
    });
    if (!location) {
      return createError(404, "Product ID not found");
    }
    if (location === null) {
      return createError(400, "Product ID = " + locationId + " have no item");
    }
    res.json({ location });
  } catch (err) {
    next(err);
  }
};

exports.getLocations = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Name is required and cannot be empty." });
    }

    const locations = await prisma.location.findMany({
      where: {
        OR: [
          {
            name: {
              contains: name,
            },
          },
          {
            category: {
              name: {
                contains: name,
              },
            },
          },
        ],
      },
      include: {
        category: true,
        locationImg: true,
        locationScore: true,
      },
    });

    if (locations.length === 0) {
      return createError(404, "Location not found");
    }

    res.json({ locations });
  } catch (err) {
    next(err);
  }
};