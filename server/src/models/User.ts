import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['webpage', 'book', 'video', 'podcast'],
    required: true
  },
  title: String,
  url: String,
  rating: Number,
  completed: {
    type: Boolean,
    default: false
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

const categorySchema = new mongoose.Schema({
  webpage: [materialSchema],
  video: [materialSchema],
  book: [materialSchema],
  podcast: [materialSchema]
});

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  categories: categorySchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const contributionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
});

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: "Introduce yourself"
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  photoURL: {
    type: String
  },
  topics: [topicSchema],
  contributions: {
    type: [contributionSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);