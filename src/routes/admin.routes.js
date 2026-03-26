const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
  createUserWithLicense,
  checkLicense,
} = require("../controllers/admin.controller");

router.post("/create-user", createUserWithLicense);
router.post("/check-license", checkLicense);

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;