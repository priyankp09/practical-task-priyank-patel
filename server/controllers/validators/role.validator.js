import Joi from "joi"
import objectId from "joi-objectid"

Joi.objectId = objectId(Joi);


// Joi.objectId = require('joi-objectid')(Joi)
export const roleValidationSchema = Joi.object({
  roleName: Joi.string().min(3).max(30).required(),
  accessModules: Joi.array().items(Joi.string()).unique().required(),
  active: Joi.boolean()
});


export const getRoleList = Joi.object({
  search: Joi.string()
});

export const getRoleByIdSchema = Joi.object({
  id: Joi.objectId().required(),
});

