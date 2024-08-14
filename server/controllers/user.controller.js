import { asyncHandler } from "../utils/asyncHandler.js";
import {ErrorHandler} from "../utils/errorHandler.js"
import { User} from "../models/user.model.js"
import { Role} from "../models/role.model.js"
import { ResponseHandler } from "../utils/ResponseHandler.js";
import { userValidationSchema, getUserByIdSchema} from './validators/user.validator.js';

import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()

        await user.save({ validateBeforeSave: false })
        return {accessToken}

    } catch (error) {
        throw new ErrorHandler(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        res.status(400).json({
            success: false,
            message: 'All fields are required',
        });
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        res.status(409).json({
            success: false,
            message: 'User with email or username already exists',
        });
    }


    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password"
    )

    if (!createdUser) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while registering the user',
        });
    }

    return res.status(201).json(
        new ResponseHandler(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) =>{
    
    const {email, password} = req.body

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'email is required',
        });
    }
    
    const user = await User.findOne({email : email})

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User does not exist',
        });
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    return res.status(404).json({
        success: false,
        message: 'Invalid user credentials',
    });
    }

   const {accessToken} = await generateAccessTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password")

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }

    return res
    .status(200)
    // .cookie("accessToken", accessToken, options)
    .json(
        new ResponseHandler(
            200, 
            {
                accessToken : accessToken,
                user: loggedInUser
            },
            "User logged In Successfully"
        )
    )

})


// create user 

const createUser = async (req, res) => {
    try {
      const { username, firstName, lastName, email, password, role } = req.body;
  
      const { error } = userValidationSchema.validate(req.body);
   
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      // Check if username already exists
        const existedUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existedUser) {
            return res.status(400).json({ message: 'User with email or username already exists' });
        }

  
      // Check if role exists
      const findRole = await Role.findById(role);
      if (!findRole) {
        return res.status(400).json({ message: 'Role not found' });
      }

      const newUser = await User.create({
        username: username.toLowerCase(),
        firstName,
        lastName,
        email,
        password, 
        role
      });
        if (!newUser) {
            return res.status(401).json({
                success: false,
                message: 'User not created'
            });
        }

        return res
            .status(201)
            .json(new ResponseHandler(201, newUser, "User created successfully"))
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

const getUserList = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const query = {};
        const matchField = {};

        if (search) {
            matchField.$or = [
                { username: { $regex: search, $options: 'i' } },
                { firstname: { $regex: search, $options: 'i' } },
                { lastname: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (page - 1) * limit;

        const aggregationPipeline = [
            { $match: matchField },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'role',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {
                $unwind: {
                    path: '$role',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    username: 1,
                    firstname: 1,
                    lastname: 1,
                    roleName: '$role.roleName',
                    accessModules: '$role.accessModules'
                }
            },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];
        
        const users = await User.aggregate(aggregationPipeline);

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { firstname: { $regex: search, $options: 'i' } },
                { lastname: { $regex: search, $options: 'i' } }
            ];
        }
       
        // Get total
        const total = await User.countDocuments(query);
        console.log('total: ____', total);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            }
        });


    } catch (error) {
        console.error('Error fetching user list:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = getUserByIdSchema.validate(req.params);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'roles', // The collection name for the Role model
                    localField: 'role',
                    foreignField: '_id',
                    as: 'roleInfo'
                }
            },
            {
                $unwind: '$roleInfo'
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    role: {
                        roleName: '$roleInfo.roleName',
                        accessModules: '$roleInfo.accessModules'
                    },
                    createdAt: 1,
                    active: 1
                }
            }
        ]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res
            .status(200)
            .json(new ResponseHandler(200, user))
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, firstName, lastName, email, role } = req.body;

    try {
        const { error } = getUserByIdSchema.validate(req.params);
        if (error) {
            console.log('error.details[0].message: ', error.details[0].message);
            return res.status(400).json({ message: error.details[0].message });
        }

        let user = await User.findById(id).populate('role', 'roleName accessModules');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const findRole = await Role.findById(role).select('roleName accessModules');
        if (!findRole) {
            return res.status(400).json({ message: 'Invalid role ID' });
        }

        // Update user fields if provided
        if (username) user.username = username;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (role) user.role = role;


        // Save the updated user
        user = await user.save();
        user.role = findRole

        return res
        .status(200)
        .json(new ResponseHandler(200, user,'User updated successfully'))

    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const { error } = getUserByIdSchema.validate(req.params);
  
      if (error) {
        console.log('error.details[0].message: ', error.details[0].message);
        return res.status(400).json({ message: error.details[0].message });
      }
  
      
      const user = await User.findByIdAndDelete(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      return res
      .status(200)
      .json(new ResponseHandler(200, user))
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };


const checkAccess = async (req, res) => {
    try {
        const userId = req.params.id;
        const { moduleName } = req.body;

        const user = await User.findById(userId).populate('role');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const { accessModules } = user.role;
        const hasAccess = accessModules.includes(moduleName);


        return res.status(200).json({ hasAccess });
    } catch (err) {
        // Handle errors
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const updateSameData = async (req, res) => {
    try {
        const { filter, updateData } = req.body;

        if (!filter || !updateData) {
            return res.status(400).json({ msg: 'Filter and update data are required' });
        }
        const result = await User.updateMany(filter, { $set: updateData });

        res.status(200).json({ msg: 'Users updated successfully', modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};

const updateDifferentData = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ msg: 'Updates array is required and should not be empty' });
        }

        // Create bulk operations
        const bulkOps = updates.map(update => {
            return {
                updateOne: {
                    filter: { _id: update.id },
                    update: { $set: update.data }
                }
            };
        });

        const result = await User.bulkWrite(bulkOps);

        res.status(200).json({ msg: 'Users updated successfully', modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
    }
};
export {
    registerUser,
    loginUser,
    
    createUser,
    getUserList,
    getUserById,
    updateUser,
    deleteUser,
    checkAccess,
    updateSameData,
    updateDifferentData
}