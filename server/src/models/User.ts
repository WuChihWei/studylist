import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['webpage', 'video', 'podcast', 'book'],
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  title: String,
  url: String,
  rating: Number,
  notes: String,
  completedUnits: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0
  },
  favicon: String,
  order: {
    type: Number,
    default: 0
  }
});

// 學習路徑節點
const PathNodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: {
    x: Number,
    y: Number
  },
  data: mongoose.Schema.Types.Mixed
});

// 學習路徑連接
const PathEdgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  animated: Boolean
});

// 學習路徑
const LearningPathSchema = new mongoose.Schema({
  nodes: [PathNodeSchema],
  edges: [PathEdgeSchema]
});

const categorySchema = new mongoose.Schema({
  webpage: [MaterialSchema],
  video: [MaterialSchema],
  book: [MaterialSchema],
  podcast: [MaterialSchema]
});

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  deadline: {
    type: Date,
    default: null,
    required: false
  },
  categories: categorySchema,
  materials: [MaterialSchema],
  learningPath: {
    type: LearningPathSchema,
    default: () => ({
      nodes: [],
      edges: []
    })
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
  },
  studyCount: {
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