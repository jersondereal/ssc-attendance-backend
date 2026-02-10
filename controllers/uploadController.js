const axios = require("axios");
const FormData = require("form-data");

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

const getExpirationSecondsByYearLevel = (yearLevelRaw) => {
  const yearLevel = Number.parseInt(String(yearLevelRaw ?? "").trim(), 10);
  const yearsUntilExpiryMap = {
    1: 4,
    2: 3,
    3: 2,
    4: 1,
  };

  const yearsUntilExpiry = yearsUntilExpiryMap[yearLevel];
  if (!yearsUntilExpiry) return null;
  return yearsUntilExpiry * SECONDS_PER_YEAR;
};

const uploadController = {
  async uploadProfileImage(req, res) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const apiKey = process.env.IMGBB_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          message: "Server upload is not configured (IMGBB_API_KEY missing)",
        });
      }

      const form = new FormData();
      form.append("image", req.file.buffer, {
        filename: req.file.originalname || "image",
        contentType: req.file.mimetype,
      });

      const expirationSeconds = getExpirationSecondsByYearLevel(req.body?.year);
      const uploadUrl =
        expirationSeconds !== null
          ? `https://api.imgbb.com/1/upload?key=${apiKey}&expiration=${expirationSeconds}`
          : `https://api.imgbb.com/1/upload?key=${apiKey}`;

      const response = await axios.post(
        uploadUrl,
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const imageUrl = response.data?.data?.url;
      if (!imageUrl) {
        return res.status(502).json({
          message: "Image upload failed: no URL returned",
        });
      }

      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Profile image upload error:", error);
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        "Image upload failed";
      res.status(status).json({ message });
    }
  },
};

module.exports = uploadController;
