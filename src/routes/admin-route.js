const express = require("express");
const adminController = require("../controllers/admin-controller");
const upload = require("../middlewares/upload");
const router = express.Router();

router.post(
  "/location",
  upload.array("Images", 10),
  adminController.createLocation
);
router.post("/category", adminController.createCategory);
router.patch("/location/:locationId", adminController.updateLocation)
module.exports = router;
