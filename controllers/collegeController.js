const College = require("../models/College");

const collegeController = {
  async getAllColleges(req, res) {
    try {
      const colleges = await College.findAll();
      res.json(colleges);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching colleges", error: error.message });
    }
  },

  async getCollegeById(req, res) {
    try {
      const college = await College.findById(req.params.id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      res.json(college);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching college", error: error.message });
    }
  },

  async createCollege(req, res) {
    try {
      const { code, name, display_order } = req.body;
      if (!code || !name) {
        return res.status(400).json({ message: "Code and name are required" });
      }
      const existing = await College.findByCode(code.toLowerCase().trim());
      if (existing) {
        return res
          .status(409)
          .json({ message: "A college with this code already exists" });
      }
      const college = await College.create({
        code,
        name,
        display_order,
      });
      res.status(201).json(college);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating college", error: error.message });
    }
  },

  async updateCollege(req, res) {
    try {
      const college = await College.findById(req.params.id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      const { code, name, display_order } = req.body;
      if (code !== undefined) {
        const existing = await College.findByCode(code.toLowerCase().trim());
        if (existing && existing.id !== college.id) {
          return res
            .status(409)
            .json({ message: "A college with this code already exists" });
        }
      }
      const updated = await College.update(req.params.id, {
        code,
        name,
        display_order,
      });
      res.json(updated);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating college", error: error.message });
    }
  },

  async deleteCollege(req, res) {
    try {
      const college = await College.findById(req.params.id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      const count = await College.countStudentsByCollegeCode(college.code);
      if (count > 0) {
        return res.status(400).json({
          message:
            "Cannot delete college: it is assigned to one or more students",
        });
      }
      await College.delete(req.params.id);
      res.json({ message: "College deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting college", error: error.message });
    }
  },
};

module.exports = collegeController;
