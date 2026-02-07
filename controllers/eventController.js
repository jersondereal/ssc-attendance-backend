const Event = require("../models/Event");

const normalizeEventInput = (body) => ({
  ...body,
  colleges: body.colleges ?? body.courses,
});

const formatEventResponse = (event) => {
  if (!event) return event;
  const colleges = event.colleges ?? event.courses;
  return {
    ...event,
    colleges,
    courses: colleges,
  };
};

const eventController = {
  async getAllEvents(req, res) {
    try {
      const events = await Event.findAll();
      res.json(events.map(formatEventResponse));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching events", error: error.message });
    }
  },

  async getEventById(req, res) {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(formatEventResponse(event));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching event", error: error.message });
    }
  },

  async createEvent(req, res) {
    try {
      const { title, event_date, location, fine, sections, schoolYears } =
        req.body;
      const colleges = req.body.colleges ?? req.body.courses;

      // Validate required fields
      if (!title || !event_date || !location || fine === undefined) {
        return res.status(400).json({
          message: "Missing required fields: title, event_date, location, fine",
        });
      }

      const event = await Event.create({
        title,
        event_date,
        location,
        fine,
        colleges,
        sections,
        schoolYears,
      });

      res.status(201).json(formatEventResponse(event));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating event", error: error.message });
    }
  },

  async updateEvent(req, res) {
    try {
      const { title, event_date, location, fine, sections, schoolYears } =
        req.body;
      const colleges = req.body.colleges ?? req.body.courses;

      // Validate required fields
      if (!title || !event_date || !location || fine === undefined) {
        return res.status(400).json({
          message: "Missing required fields: title, event_date, location, fine",
        });
      }

      const event = await Event.update(req.params.id, {
        title,
        event_date,
        location,
        fine,
        colleges,
        sections,
        schoolYears,
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(formatEventResponse(event));
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating event", error: error.message });
    }
  },

  async deleteEvent(req, res) {
    try {
      const event = await Event.delete(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting event", error: error.message });
    }
  },

  async getEventsByDate(req, res) {
    try {
      const events = await Event.findByDate(req.params.date);
      res.json(events.map(formatEventResponse));
    } catch (error) {
      res.status(500).json({
        message: "Error fetching events by date",
        error: error.message,
      });
    }
  },
};

module.exports = eventController;
