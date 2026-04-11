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
const { listErrorReports } = require("../controllers/errorReport.controller");

router.post("/create-user", createUserWithLicense);
router.post("/check-license", checkLicense);
router.post("/generate-codes", generateCodes);

router.get("/licenses", listLicenses);
router.get("/devices", listDevices);
router.get("/errors", listErrorReports);
router.post("/licenses/:id/toggle", toggleLicense);
router.post("/devices/:id/toggle", toggleDevice);

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;
