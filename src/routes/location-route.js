const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location-controller")

router.get("/landing", locationController.getLocationsLanding)
router.get("/:locationId", locationController.getLocationsById)
router.get("/", locationController.getLocations)
router.post("/recommend", locationController.mlLocation)

module.exports = router;