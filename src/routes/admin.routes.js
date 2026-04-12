const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
  createUserWithLicense,
  checkLicense,
  listLicenses,
  listDevices,
  toggleLicense,
  toggleDevice,
} = require("../controllers/admin.controller");
const { generateCodes } = require("../controllers/licenseCode.controller");
const {
  listErrorReports,
  reviewErrorReport,
  deleteErrorReport,
  deleteReviewedErrors,
  deleteAllErrors,
} = require("../controllers/errorReport.controller");
const {
  listDemos,
  toggleDemo,
  updateDemo,
} = require("../controllers/adminDemos.controller");

router.post("/create-user", createUserWithLicense);
router.post("/check-license", checkLicense);
router.post("/generate-codes", generateCodes);

router.get("/licenses", listLicenses);
router.get("/devices", listDevices);
router.get("/demos", listDemos);
router.get("/errors", listErrorReports);
router.post("/errors/:id/review", reviewErrorReport);
router.delete("/errors/reviewed", deleteReviewedErrors);
router.post("/errors/delete-all", deleteAllErrors);
router.delete("/errors/:id", deleteErrorReport);
router.post("/licenses/:id/toggle", toggleLicense);
router.post("/devices/:id/toggle", toggleDevice);
router.post("/demos/:id/toggle", toggleDemo);
router.post("/demos/:id/update", updateDemo);

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;
