const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const { DecisionTreeClassifier } = require("ml-cart");

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
    const { locationId } = req.params;
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

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ error: "Name is required and cannot be empty." });
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

let decisionTree;

const trainModel = async () => {
  try {
    const locations = await prisma.location.findMany();

    if (!locations || locations.length === 0) {
      console.error("No location data found!");
      return;
    }

    let X = locations.map((place) => [
      place.budget === "LOW" ? 0 : place.budget === "MEDIUM" ? 1 : 2,
      place.price ? parseFloat(place.price) : 0,
    ]);

    let Y = locations.map((place) => place.categoryId);

    decisionTree = new DecisionTreeClassifier();
    decisionTree.train(X, Y);
    console.log("Decision Tree Model Trained!");
  } catch (err) {
    console.error("Error training model:", err);
  }
};

trainModel();

exports.mlLocation = async (req, res, next) => {
  try {
    const { budget, categoryId } = req.body;

    if (!decisionTree)
      return res.status(500).json({ error: "Model is not trained yet" });

    if (!budget) {
      return res.status(400).json({ error: "Budget is required" });
    }

    let budgetValue = budget === "LOW" ? 0 : budget === "MEDIUM" ? 1 : 2;

    if (!categoryId) {
      const locations = await prisma.location.findMany({
        where: {
          budget: budget.toUpperCase(),
        },
        include: {
          category: true,
          locationImg: true,
        },
      });

      if (!locations || locations.length === 0) {
        return res.status(404).json({ error: "No matching location found" });
      }

      return res.json({ recommendedLocations: locations });
    }

    let inputData = [budgetValue, 0];
    let predictedCategoryId = decisionTree.predict([inputData])[0];

    let categoryToSearch = categoryId ? Number(categoryId) : predictedCategoryId;

    const locations = await prisma.location.findMany({
      where: {
        budget: budget.toUpperCase(),
        categoryId: categoryToSearch,
      },
      include: {
        category: true,
        locationImg: true,
      },
    });

    if (!locations || locations.length === 0) {
      return res.status(404).json({ error: "No matching location found" });
    }

    res.json({ recommendedLocations: locations });
  } catch (err) {
    next(err);
  }
};
