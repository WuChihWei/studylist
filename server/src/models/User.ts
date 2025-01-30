import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  email: String,
  materials: [{
    type: {
      type: String,
      enum: [ 'webpage', 'book', 'video', 'podcast']
    },
    title: String,
    url: String,
    rating: Number,
    dateAdded: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);