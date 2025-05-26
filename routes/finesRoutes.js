const express = require('express');
const router = express.Router();
const finesController = require('../controllers/finesController');

// Get all fines for a student
router.get('/student/:studentId', finesController.getStudentFines);

// Get total unpaid fines for a student
router.get('/student/:studentId/total', finesController.getTotalUnpaidFines);

// Update fine payment status
router.put('/student/:studentId/event/:eventId', finesController.updateFineStatus);

module.exports = router; 