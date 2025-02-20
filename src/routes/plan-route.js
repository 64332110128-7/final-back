const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const planController = require("../controllers/plan-controller");

router.post("/createPlan/:userId", planController.createPlan);
router.post("/plan-location", planController.addLocation);
router.delete(
  "/:planId/plan_location/:locationId",
  authenticate,
  planController.deleteLocation
);
router.delete("/:planId", authenticate, planController.deletePlan);
router.patch("/:planId", authenticate, planController.editPlan);
router.get("/:planId", planController.getPlanById);

module.exports = router;
