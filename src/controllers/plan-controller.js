const prisma = require("../config/prisma");
const createError = require("../utils/createError");

exports.createPlan = async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body;
    const { userId } = req.params;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: name, startDate, or endDate",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // คำนวณจำนวนวัน
    const timeDiff = end - start;
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    // สร้างอาร์เรย์ของวัน
    const days = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
    }));

    // สร้างแผนการเดินทางพร้อมกับ planDays
    const plan = await prisma.plan.create({
      data: {
        userId: parseInt(userId),
        name,
        startDate: start,
        endDate: end,
        planDays: {
          create: days,
        },
      },
      include: {
        planDays: true,
      },
    });

    res.json({ message: "✅ Plan created successfully", plan });
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
      select: { userId: true },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this plan" });
    }

    await prisma.plan.delete({
      where: { planId: Number(planId) },
    });

    res.json({
      message: "Plan deleted successfully",
      deletedId: Number(planId),
    });
  } catch (err) {
    next(err);
  }
};

exports.addLocation = async (req, res, next) => {
  try {
    const { planId, planDayId, locationIds } = req.body;

    if (!planId || !planDayId || !locationIds || !Array.isArray(locationIds)) {
      return res
        .status(400)
        .json({ error: "Missing required fields: planId, planDayId, or locationIds" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const planDay = await prisma.planDay.findUnique({
      where: { id: Number(planDayId) },
    });

    if (!planDay) {
      return res.status(404).json({ error: "PlanDay not found" });
    }

    const locations = await prisma.location.findMany({
      where: {
        locationId: { in: locationIds.map(Number) },
      },
    });

    if (locations.length !== locationIds.length) {
      return res.status(404).json({ error: "Some locations not found" });
    }

    const existingLocations = await prisma.plan_location.findMany({
      where: {
        planDayId: Number(planDayId),
        locationId: { in: locationIds.map(Number) },
      },
    });

    const newLocationIds = locationIds.filter(
      (id) => !existingLocations.some((loc) => loc.locationId === id)
    );

    if (newLocationIds.length === 0) {
      return res.status(400).json({ error: "No new locations to add" });
    }

    const newPlanLocations = await prisma.plan_location.createMany({
      data: newLocationIds.map((id) => ({
        planDayId: Number(planDayId),
        locationId: id,
      })),
    });

    res.json({
      message: "✅ Locations added to PlanDay",
      added: newLocationIds,
      existing: existingLocations.map((loc) => loc.locationId),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    const { planId, planDayId, locationId } = req.params;

    if (!planId || !planDayId || !locationId) {
      return res.status(400).json({ error: "Missing required parameters: planId, planDayId, or locationId" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const planDay = await prisma.planDay.findUnique({
      where: { id: Number(planDayId) },
    });

    if (!planDay) {
      return res.status(404).json({ error: "PlanDay not found" });
    }

    const existingLocation = await prisma.plan_location.findFirst({
      where: {
        planDayId: Number(planDayId),
        locationId: Number(locationId),
      },
    });

    if (!existingLocation) {
      return res.status(404).json({
        error: "Location not found in this PlanDay",
      });
    }

    const deleteResult = await prisma.plan_location.delete({
      where: {
        id: existingLocation.id,
      },
    });

    res.json({ message: "✅ Location removed from PlanDay", deletedLocation: deleteResult });
  } catch (err) {
    next(err);
  }
};


exports.editPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const userId = req.user.userId;
    const { name, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!name && !budget && !day) {
      return res.status(400).json({
        error: "At least one field (name, budget, day) is required",
      });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      select: { userId: true, planDays: true },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    if (plan.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to edit this plan" });
    }

    const newStartDate = startDate ? new Date(startDate) : plan.startDate;
    const newEndDate = endDate ? new Date(endDate) : plan.endDate;
    const newTotalDays = Math.ceil((newEndDate - newStartDate) / (1000 * 3600 * 24)) + 1;

    const currentDays = plan.planDays.length;

    if (newTotalDays > currentDays) {
      const newPlanDays = [];
      for (let i = currentDays; i < newTotalDays; i++) {
        const newPlanDay = await prisma.planDay.create({
          data: {
            planId: Number(planId),
            day: i + 1,
          },
        });
        newPlanDays.push(newPlanDay);
      }
    } 
    else if (newTotalDays < currentDays) {
      for (let i = currentDays; i > newTotalDays; i--) {
        await prisma.planDay.delete({
          where: { id: plan.planDays[i - 1].id },
        });
      }
    }

    const updatedPlan = await prisma.plan.update({
      where: { planId: Number(planId) },
      data: {
        name: name || undefined,
        startDate: newStartDate,
        endDate: newEndDate,
      },
      select: {
        planId: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    res.json({
      message: "Plan updated successfully",
      data: updatedPlan,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res
        .status(400)
        .json({ error: "Missing required parameter: planId" });
    }

    const plan = await prisma.plan.findUnique({
      where: { planId: Number(planId) },
      include: {
        planDays: {
          include: {
            locations: {
              include: {
                location: {
                  include: { category: true, locationImg: true },
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
