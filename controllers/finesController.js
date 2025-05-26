const Attendance = require('../models/Attendance');

const finesController = {
  // Get all fines for a student
  async getStudentFines(req, res) {
    try {
      const { studentId } = req.params;
      const fines = await Attendance.getStudentFines(studentId);
      res.json(fines);
    } catch (error) {
      console.error('Error fetching student fines:', error);
      res.status(500).json({ message: 'Failed to fetch student fines' });
    }
  },

  // Update fine payment status
  async updateFineStatus(req, res) {
    try {
      const { studentId, eventId } = req.params;
      const { isPaid } = req.body;

      const updatedFine = await Attendance.updateFineStatus(studentId, eventId, isPaid);
      
      if (!updatedFine) {
        return res.status(404).json({ message: 'Fine record not found' });
      }

      res.json(updatedFine);
    } catch (error) {
      console.error('Error updating fine status:', error);
      res.status(500).json({ message: 'Failed to update fine status' });
    }
  },

  // Get total unpaid fines for a student
  async getTotalUnpaidFines(req, res) {
    try {
      const { studentId } = req.params;
      const totalUnpaid = await Attendance.getTotalUnpaidFines(studentId);
      res.json({ totalUnpaid });
    } catch (error) {
      console.error('Error fetching total unpaid fines:', error);
      res.status(500).json({ message: 'Failed to fetch total unpaid fines' });
    }
  }
};

module.exports = finesController; 