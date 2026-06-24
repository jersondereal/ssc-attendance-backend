const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

// Read — any authenticated user
router.get("/system", authMiddleware, settingsController.getSystemSettings);
router.get("/general", authMiddleware, settingsController.getGeneralSettings);

// Write — administrator only
router.put("/system", authMiddleware, roleMiddleware("administrator"), settingsController.updateSystemSettings);
router.put("/general", authMiddleware, roleMiddleware("administrator"), settingsController.updateGeneralSettings);

// Backup/restore — administrator only
router.get("/backup", authMiddleware, roleMiddleware("administrator"), settingsController.getBackup);
router.post("/restore", authMiddleware, roleMiddleware("administrator"), settingsController.restoreBackup);

module.exports = router;
