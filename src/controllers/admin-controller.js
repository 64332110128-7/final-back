const fs = require("fs").promises;
const path = require("path");
const cloudDelete = require("../utils/cloudDelete");
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
    const { name, categoryId } = req.body;

    // ตรวจสอบว่า location ชื่อนี้มีอยู่แล้วหรือไม่
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: value.name,
      },
    });

    if (existingLocation) {
      return res.status(400).json({ message: "สถานที่นี้มีอยู่แล้วในระบบ" });
    }

    const Location = await prisma.location.create({
      data: {
        ...value,
        categoryId: Number(categoryId),
      },
    });

    const locationImages = await Promise.all(
      req.files.map(async (file) => {
        const cloudUrl = await cloudUpload(file.path);
        return {
          url: cloudUrl,
          filename: file.filename,
          locationId: Location.locationId,
        };
      })
    );

    await prisma.locationImg.createMany({
      data: locationImages,
    });

    const newLocation = await prisma.location.findFirst({
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

exports.getCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return next(createError(400, "Category ID is required"));
    }
    const locations = await prisma.location.findMany({
      where: {
        categoryId: Number(categoryId),
      },
      include: {
        category: true,
        locationImg: true,
      },
    });

    if (locations.length === 0) {
      return next(createError(404, "No locations found for the category"));
    }

    res.json({ locations });
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
        return next(createError(400, "Category is invalid"));
      }
    }

    const existingLocation = await prisma.location.findUnique({
      where: { locationId: Number(locationId) },
      include: { locationImg: true },
    });

    if (!existingLocation) {
      return next(createError(404, "Location not found"));
    }

    const updatedLocation = await prisma.location.update({
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

    if (req.files && req.files.length > 0) {
      const deleteImageTasks = existingLocation.locationImg.map(async (img) => {
        try {
          await cloudDelete(img.url);
          const filePath = path.join(process.cwd(), "uploads", img.filename);
          console.log(`Checking file: ${filePath}`);

          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
          } catch (err) {
            console.warn(`File not found or can't delete: ${filePath}`, err);
          }
        } catch (err) {
          console.error(`Failed to delete image: ${img.url}`, err);
        }
      });
      await Promise.all(deleteImageTasks);

      await prisma.locationImg.deleteMany({
        where: { locationId: Number(locationId) },
      });

      const newImages = await Promise.all(
        req.files.map(async (file) => {
          const cloudUrl = await cloudUpload(file.path);
          return {
            url: cloudUrl,
            filename: file.filename,
            locationId: Number(locationId),
          };
        })
      );

      await prisma.locationImg.createMany({
        data: newImages,
      });
    }

    const location = await prisma.location.findUnique({
      where: { locationId: Number(locationId) },
      include: {
        locationImg: true,
        category: true,
      },
    });

    res.json({ location });
  } catch (err) {
    next(err);
  }
};

exports.deleteLocation = async (req, res, next) => {
  const { locationId } = req.params;

  try {
    const location = await prisma.location.findUnique({
      where: { locationId: Number(locationId) },
      include: { locationImg: true },
    });

    if (!location) {
      return next(createError(404, "Location not found"));
    }

    const deleteImageTasks = location.locationImg.map(async (img) => {
      try {
        await cloudDelete(img.url);

        const filePath = path.join(process.cwd(), "uploads", img.filename);
        console.log(`Checking file: ${filePath}`);

        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          console.warn(`File not found or can't delete: ${filePath}`, err);
        }
      } catch (err) {
        console.error(`Failed to delete image: ${img.url}`, err);
      }
    });

    await Promise.all(deleteImageTasks);

    await prisma.locationImg.deleteMany({
      where: { locationId: location.locationId },
    });

    const deletedLocation = await prisma.location.delete({
      where: { locationId: Number(locationId) },
    });

    res.json({ msg: "✅ Delete success", result: deletedLocation });
  } catch (err) {
    next(err);
  }
};
