const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  // Only count failed logins toward the limit, so successful logins (e.g. the
  // frontend's auto-login) don't burn the budget — this stays a brute-force
  // guard, not a general request cap.
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/login", loginLimiter, userController.login);
router.get("/ip", (req, res) => {
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress;
  res.json({ ip });
});

// Protected routes — administrator only
router.get("/", authMiddleware, userController.getAllUsers);
router.post("/", authMiddleware, roleMiddleware("administrator"), userController.createUser);
router.put("/:id", authMiddleware, roleMiddleware("administrator"), userController.updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("administrator"), userController.deleteUser);

module.exports = router;
