import { Schema,model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const userSchema = new Schema({
    fullName : {
        type : String,
        required : [true,"Fullname is required"],
        trim : true,
        lowercase : true,
        minLength : [5,"Fullname must be at least 5 characters"],
        maxLength : [50,"Fullname must be at most 50 characters"]
    },
    email : {
        type : String,
        required : [true,"Email is required"],
        unique : true,
        lowercase : true,
        trim : true,
        match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Please fill a valid email address"]
    },
    password : {
        type : String,
        required : [true,"Password is required"],
        minLength : [6,"Password must be at least 6 characters"],
        maxLength : [64,"Password must be at most 64 characters"],
        select : false,
    }   ,
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    subscription: {
      id: String,
      status: String,
    },
    avatar: {
        public_id: {
            type: String,
            required: true
        },
        secure_url: {   
            type: String,
            required: true
        }
    },
    forgotPasswordToken : String,
    forgotPasswordExpiry : Date,

},{timestamps : true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next();
});
userSchema.methods = {
    generateToken : async function(){
        return await jwt.sign({_id : this._id,role: this.role}, process.env.JWT_SECRET,{
            expiresIn : process.env.JWT_EXPIRY
        });
    },
    comparePassword : async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword,this.password);
    },
    generatePasswordResetToken : async function(){
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
            
        this.forgotPasswordExpiry = Date.now() + (20 * 60 * 1000);
        
        return resetToken;
    }
}
const User = model("User",userSchema);
export default User;