const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Auth routes
router.post("/login", userController.login);

// User management routes
router.get("/", userController.getAllUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Get client IP address
router.get("/ip", (req, res) => {
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress;
  res.json({ ip });
});

module.exports = router;
