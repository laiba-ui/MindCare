// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6 },
  university: { type: String, default: '' },
  year:       { type: String, default: '' },
  avatar:     { type: String, default: '🧕' },
  bio:        { type: String, default: '' },
  phone:      { type: String, default: '' },
  streak:     { type: Number, default: 0 },
  lastLogDate:{ type: String, default: '' }, // 'YYYY-M-D' format
  createdAt:  { type: Date,   default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password helper
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);