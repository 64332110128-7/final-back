const cloudUpload = require("../utils/cloudUpload");
const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const {
  createLocationSchema,
  updateLocationSchema,
} = require("../validator/admin-validator");

exports.createLocation = async (req, res, next) => {
  try {
    const value = await createLocationSchema.validateAsync(req.body);

    const { categoryId } = req.body;

    const Location = await prisma.location.create({
      data: {
        ...value,
        categoryId: Number(categoryId),
      },
    });

    const imagesPromiseArray = req.files.map((file) => {
      return cloudUpload(file.path);
    });

    const imgUrlArray = await Promise.all(imagesPromiseArray);

    const productImages = imgUrlArray.map((imgUrl) => {
      return {
        url: imgUrl,
        locationId: Location.locationId,
      };
    });

    await prisma.LocationImg.createMany({
      data: productImages,
    });

    const newLocation = await prisma.Location.findFirst({
      where: {
        locationId: Location.locationId,
      },
      include: {
        locationImg: true,
        category: true,
      },
    });

    res.json({ newLocation });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const Category = await prisma.category.create({
      data: {
        name,
      },
    });
    res.json({ Category });
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const value = await updateLocationSchema.validateAsync(req.body);

    if (value.categoryId) {
      const existCate = await prisma.category.findUnique({
        where: {
          categoryId: Number(value.categoryId),
        },
      });

      if (!existCate) {
        return createError(400, "Category is invalid");
      }
    }

    const existLocation = await prisma.location.findUnique({
      where: {
        locationId: Number(locationId),
      },
    });

    if (!existLocation) {
      return next(createError(404, "Location not found"));
    }

    const location = await prisma.location.update({
      where: {
        locationId: Number(locationId),
      },
      data: {
        ...value,
      },
      include: {
        category: true,
      },
    });

    res.json({ location });
  } catch (err) {
    next(err);
  }
};
