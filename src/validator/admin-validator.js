const Joi = require("joi");

exports.createLocationSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  categoryId: Joi.number(),
});

exports.updateLocationSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  categoryId: Joi.number(),
});
