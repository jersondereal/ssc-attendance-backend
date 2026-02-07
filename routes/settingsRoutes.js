const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/system", settingsController.getSystemSettings);
router.put("/system", settingsController.updateSystemSettings);
router.get("/general", settingsController.getGeneralSettings);
router.put("/general", settingsController.updateGeneralSettings);
router.get("/backup", settingsController.getBackup);
router.post("/restore", settingsController.restoreBackup);

module.exports = router;
