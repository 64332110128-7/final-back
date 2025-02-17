const prisma = require("../config/prisma");
const createError = require("../utils/createError");
const cloudDelete = require("../utils/cloudDelete");
const cloudUpload = require("../utils/cloudUpload");
const { DecisionTreeClassifier } = require("ml-cart");
const fs = require("fs").promises;
const path = require("path");

exports.getLocationsLanding = async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        category: true,
        locationImg: true,
        locationScore: true,
      },
    });
    if (!locations || locations.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json({ locations });
  } catch (err) {
    next(err);
  }
};

exports.getLocationsById = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const location = await prisma.location.findUnique({
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
      return res.status(404).json({ message: "Location ID not found" });
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


exports.addCommentAndRating = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const { text, rating } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Please specify comment text." });
    }

    const location = await prisma.location.findUnique({
      where: { locationId: Number(locationId) },
    });
    if (!location) {
      return res.status(404).json({ error: "This Location was not found." });
    }

    const comment = await prisma.locationComment.create({
      data: {
        text,
        user: { connect: { userId } },
        location: { connect: { locationId: Number(locationId) } },
      },
      include: { user: true },
    });

    let commentImages = [];
    if (req.files && req.files.length > 0) {
      commentImages = await Promise.all(
        req.files.map(async (file) => {
          const cloudUrl = await cloudUpload(file.path);
          return {
            url: cloudUrl,
            filename: file.filename,
            commentId: comment.commentId,
          };
        })
      );

      await prisma.locationCommentImg.createMany({
        data: commentImages,
      });
    }

    let scoreResult = null;
    if (rating !== undefined && rating !== null) {
      scoreResult = await prisma.locationScore.upsert({
        where: {
          userId_locationId: {
            userId,
            locationId: Number(locationId),
          },
        },
        update: {
          score: Number(rating),
        },
        create: {
          score: Number(rating),
          user: { connect: { userId } },
          location: { connect: { locationId: Number(locationId) } },
          comment: { connect: { commentId: comment.commentId } },
        },
      });
    }else {
      scoreResult = await prisma.locationScore.create({
        data: {
          score: Number(rating),
          user: { connect: { userId } },
          location: { connect: { locationId: Number(locationId) } },
        },
      });
    }

    const averageScore = await prisma.locationScore.aggregate({
      where: { locationId: Number(locationId) },
      _avg: { score: true },
    });
    
    await prisma.location.update({
      where: { locationId: Number(locationId) },
      data: { averageScore: averageScore._avg.score },
    });

    res.status(201).json({ comment, commentImages, score: scoreResult });
  } catch (error) {
    next(error);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text, rating } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Please specify comment text." });
    }

    const comment = await prisma.locationComment.findUnique({
      where: { commentId: Number(commentId) },
      include: { images: true },
    });
    if (!comment) {
      return next(createError(404, "This comment was not found."));
    }

    if (comment.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "You do not have permission to edit this comment." });
    }

    const updatedComment = await prisma.locationComment.update({
      where: { commentId: Number(commentId) },
      data: { text },
      include: { images: true },
    });

    let updatedRating = null;
    if (rating !== undefined && rating !== null) {
      updatedRating = await prisma.locationScore.upsert({
        where: {
          userId_locationId: {
            userId,
            locationId: comment.locationId,
          },
        },
        update: {
          score: Number(rating),
        },
        create: {
          score: Number(rating),
          user: { connect: { userId } },
          location: { connect: { locationId: comment.locationId } },
          comment: { connect: { commentId: comment.commentId } },
        },
      });
    }

    const averageScore = await prisma.locationScore.aggregate({
      where: { locationId: comment.locationId },
      _avg: { score: true },
    });
    
    await prisma.location.update({
      where: { locationId: comment.locationId },
      data: { averageScore: averageScore._avg.score },
    });

    if (req.files && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file) => {
          const cloudUrl = await cloudUpload(file.path);
          return {
            url: cloudUrl,
            commentId: Number(commentId),
          };
        })
      );

      await prisma.locationCommentImg.createMany({
        data: newImages,
      });

      const commentWithImages = await prisma.locationComment.findUnique({
        where: { commentId: Number(commentId) },
        include: { images: true },
      });
      return res.json({ comment: commentWithImages, rating: updatedRating });
    }

    res.json({ comment: updatedComment, rating: updatedRating });
  } catch (error) {
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await prisma.locationComment.findUnique({
      where: { commentId: Number(commentId) },
      include: { images: true },
    });
    if (!comment) {
      return next(createError(404, "This comment was not found."));
    }

    if (comment.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "You do not have the right to delete this comment." });
    }

    const deleteImageTasks = comment.images.map(async (img) => {
      try {
        await cloudDelete(img.url);
        if (img.filename && img.filename.trim() !== "") {
          const filePath = path.join(process.cwd(), "uploads", img.filename);
          console.log(`Checking file: ${filePath}`);

          try {
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              await fs.unlink(filePath);
              console.log(`Deleted file: ${filePath}`);
            } else {
              console.warn(`Path is not a file: ${filePath}`);
            }
          } catch (err) {
            console.warn(`File not found or cannot be deleted: ${filePath}`, err);
          }
        } else {
          console.warn("There is no filename value for this image.");
        }
      } catch (err) {
        console.error(`Failed to delete photos from cloud: ${img.url}`, err);
      }
    });

    await Promise.all(deleteImageTasks);

    const deletedComment = await prisma.locationComment.delete({
      where: { commentId: Number(commentId) },
    });

    const averageScore = await prisma.locationScore.aggregate({
      where: { locationId: comment.locationId },
      _avg: { score: true },
    });
    
    await prisma.location.update({
      where: { locationId: comment.locationId },
      data: { averageScore: averageScore._avg.score },
    });

    res.json({ msg: "The comment has been deleted.", comment: deletedComment });
  } catch (error) {
    next(error);
  }
};

exports.replyComment = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    const parentComment = await prisma.locationComment.findUnique({
      where: { commentId: Number(parentId) },
    });
    if (!parentComment) {
      return res.status(404).json({ message: "This comment was not found." });
    }
    const locationId = parentComment.locationId;

    const reply = await prisma.locationComment.create({
      data: {
        text,
        user: { connect: { userId } },
        location: { connect: { locationId: Number(locationId) } },
        parent: { connect: { commentId: Number(parentId) } },
      },
    });

    res.status(201).json({ reply });
  } catch (error) {
    next(error);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const fetchComments = async (parentId = null) => {
      const comments = await prisma.locationComment.findMany({
        where: {
          locationId: Number(locationId),
          parentId: parentId,
        },
        include: {
          user: true,
        },
      });

      for (let comment of comments) {
        comment.replies = await fetchComments(comment.commentId);
      }

      return comments;
    };

    const comments = await fetchComments();

    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};