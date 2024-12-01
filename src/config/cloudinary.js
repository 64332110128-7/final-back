const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dab1znpcw",
  api_key: "481195724499221",
  api_secret: process.env.CLOUDINARY_SECRET,
});

module.exports = cloudinary;
