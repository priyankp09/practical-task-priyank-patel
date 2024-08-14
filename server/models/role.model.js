import mongoose, {Schema} from "mongoose";

const roleSchema = new Schema(
    {
      roleName: {
        type: String,
        required: true,
        unique: true
      },
      accessModules: {
        type: [String], // Array of strings representing the modules
        required: true,
        validate: {
          validator: function(arr) {
            return arr.length === new Set(arr).size; // Ensures only unique values
          },
          message: 'Access modules must be unique.'
        },
        default : []
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      active: {
        type: Boolean,
        default: true
      }
    },
    {
        timestamps: true
    }
)



export const Role = mongoose.model("Role", roleSchema)