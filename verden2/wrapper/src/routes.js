// src/routes.js
const express = require("express");
const router = express.Router();
const controller = require("./controllers");

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post("/route", asyncHandler(controller.handleRoute));
router.post("/search", asyncHandler(controller.handleSearch));
router.post("/geocode", asyncHandler(controller.handleGeocode));
router.post("/reverse-geocode", asyncHandler(controller.handleReverseGeocode));
router.post("/nearby", asyncHandler(controller.handleNearby));
router.post("/place-details", asyncHandler(controller.handlePlaceDetails));

module.exports = router;
