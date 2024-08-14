import Joi from "joi"
import objectId from "joi-objectid"

Joi.objectId = objectId(Joi);

export const userValidationSchema = Joi.object({
    username: Joi.string().alphanum().min(2).max(50).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.objectId(), 
    active: Joi.boolean()
});


export const getUserByIdSchema = Joi.object({
    id: Joi.objectId().required(),
  });
