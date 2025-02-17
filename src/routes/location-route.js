const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location-controller");
const authenticate = require("../middlewares/authenticate");
const upload = require("../middlewares/upload");

router.get("/landing", locationController.getLocationsLanding);
router.get("/:locationId", locationController.getLocationsById);
router.get("/", locationController.getLocations);
router.post("/recommend", locationController.mlLocation);
router.post(
  "/:locationId/comment",
  authenticate,
  upload.array("images", 10),
  locationController.addCommentAndRating
);
router.put("/comments/:commentId", authenticate, upload.array("images", 10), locationController.updateComment);
router.delete("/comments/:commentId", authenticate, locationController.deleteComment);
router.post('/comments/:parentId/reply', authenticate, locationController.replyComment);
router.get("/:locationId/comments", locationController.getComments);

module.exports = router;
