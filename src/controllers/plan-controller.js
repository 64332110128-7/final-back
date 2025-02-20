const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.createPlan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, day } = req.body;

    if (!name || !day) {
      return res.status(400).json({ error: "Missing required fields: name or day" });
    }

    const plan = await prisma.plan.create({
      data: {
        userId: parseInt(userId),
        name,
        day,
      },
    });
    res.json({ message: "Location added to cart successfully", plan });
  } catch (err) {
    next(err);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      select: { userId: true }
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this plan" });
    }

    await prisma.plan.delete({
      where: { planId: Number(planId) }
    });

    res.json({ 
      message: "Plan deleted successfully",
      deletedId: Number(planId)
    });

  } catch (err) {
    next(err);
  }
};

exports.addLocation = async (req, res, next) => {
  try {
    const { planId, locationId } = req.body;

    if (!planId || !locationId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: planId or locationId" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const planLocation = await prisma.plan_location.createMany({
      data: locationId.map((locationId) => ({
        planId: planId,
        locationId,
      })),
      skipDuplicates: true,
    });
    res.json({ message: "Location added to cart successfully", planLocation });
  } catch (err) {
    next(err);
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    const { planId, locationId } = req.params;
    const userId = req.user.userId;

    if (!planId || !locationId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      select: { userId: true },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to modify this plan" });
    }

    const deleteResult = await prisma.plan_location.deleteMany({
      where: {
        planId: Number(planId),
        locationId: Number(locationId),
      },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({
        error: "Location not found in this plan",
      });
    }

    res.json({ message: "Location was removed from plan" });
  } catch (err) {
    next(err);
  }
};

exports.editPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { name, budget, day } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!name && !budget && !day) {
      return res.status(400).json({ 
        error: "At least one field (name, budget, day) is required" 
      });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      select: { userId: true }
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to edit this plan" });
    }

    const updatedPlan = await prisma.plan.update({
      where: { planId: Number(planId) },
      data: { 
        name: name || undefined, 
        budget: budget !== undefined ? Number(budget) : undefined,
        day: day || undefined
      },
      select: {
        planId: true,
        name: true,
        budget: true,
        day: true,
      }
    });

    res.json({
      message: "Plan updated successfully",
      data: updatedPlan
    });
  } catch (err) {
    next(err);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({ error: "Missing required parameter: planId" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      include: {
        plan_location: {
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

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ plan });
  } catch (err) {
    next(err);
  }
};
