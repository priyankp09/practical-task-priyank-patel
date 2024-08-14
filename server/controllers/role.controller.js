import { asyncHandler } from "../utils/asyncHandler.js";
import {ErrorHandler} from "../utils/errorHandler.js"
import { Role} from "../models/role.model.js"
import { ResponseHandler } from "../utils/ResponseHandler.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { roleValidationSchema,getRoleByIdSchema } from './validators/role.validator.js';

  const createRole = async (req, res) => {
    try {
      // Validate the request payload
      const { error } = roleValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
   
      // Check if roleName already exists
      const existingRole = await Role.findOne({ roleName: req.body.roleName });
      if (existingRole) {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
  
      // Create a new role
      const role = await Role.create({
        roleName: req.body.roleName,
        accessModules: req.body.accessModules,
        active: req.body.active,
        createdAt: new Date()
      })

      if (!role) {
        return res.status(401).json({
          success: false,
          message: 'role not created'
        });
      }
      // Send a success response
      return res
        .status(200)
        .json(new ResponseHandler(200, role, "Role created successfully"))
    } catch (err) {
      throw new ErrorHandler(500, err || "Server error")
    }
  };

  const getRoleList = async (req, res) => {
    try {
      const { search } = req.query;

      const searchQuery = search
        ? {
          $match: {
            roleName: {
              $regex: search,
              $options: 'i',
            },
          },
        }
        : { $match: {} };

      const roles = await Role.aggregate([
        searchQuery,
        {
          $project: {
            roleName: 1
          },
        },
      ]).exec();

      return res
        .status(200)
        .json(new ResponseHandler(200, roles))

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error',
      });
    }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = getRoleByIdSchema.validate(req.params);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    return res
    .status(200)
    .json(new ResponseHandler(200, role))
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateRole = async (req, res) => {
  const { id } = req.params;
  const { roleName, accessModules, active } = req.body;

  try {
    const { validatePayload } = roleValidationSchema.validate(req.body);
    const { error } = getRoleByIdSchema.validate(req.params);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    if (validatePayload) {
      return res.status(400).json({ message: validatePayload.details[0].message });
    }

    // Find the role by ID
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (roleName) role.roleName = roleName;
    if (accessModules) {
      role.accessModules = [...new Set(accessModules)];
    }
    role.active = (active) ? true : false

    const updatedRole = await role.save();

    return res
    .status(200)
    .json(new ResponseHandler(200, updatedRole))

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { error } = getRoleByIdSchema.validate(req.params);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const role = await Role.findByIdAndDelete(roleId);

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    return res
    .status(200)
    .json(new ResponseHandler(200, role))

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAccessModule = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { addModules, removeModule } = req.body;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ msg: 'Role not found' });
    }

    // Add unique access modules
    if (addModules && Array.isArray(addModules)) {
      addModules.forEach(module => {
        if (!role.accessModules.includes(module)) {
          role.accessModules.push(module);
        }
      });
    }

    // Remove a specific access module
    if (removeModule) {
      role.accessModules = role.accessModules.filter(module => module !== removeModule);
    }

    await role.save();
    res.status(200).json({ msg: 'Access modules updated successfully', role });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export {
    createRole,
    getRoleList,
    getRoleById,
    updateRole,
    deleteRole,
    updateAccessModule
}