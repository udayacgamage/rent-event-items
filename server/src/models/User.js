import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    address: { type: String, default: '' },
    passwordHash: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    totalSpending: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    refreshToken: { type: String }
  },
  { timestamps: true }
);

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

export default mongoose.model('User', userSchema);
