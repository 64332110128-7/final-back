const cloudinary = require("../config/cloudinary");

const cloudDelete = async (path) => {
  try {
    const res = await cloudinary.uploader.destroy(path);
    return res;
  } catch (err) {
    throw err;
  }
};

module.exports = cloudDelete;
