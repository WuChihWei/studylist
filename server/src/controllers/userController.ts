import { Request, Response } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const getUserByFirebaseUID = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      // Create new user if not found
      const newUser = await User.create({
        firebaseUID,
        name: 'New User',
        email: req.body.email,
        materials: [
          { type: 'book', title: 'Sample Book', rating: 4 },
          { type: 'video', title: 'Sample Video', rating: 5 },
          { type: 'podcast', title: 'Sample Podcast', rating: 3 }
        ]
      });
      return res.status(201).json(newUser);
    }
    
    res.status(200).json(user);
  } catch (error: unknown) {
    console.error('Error fetching user by Firebase UID:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      req.body,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    const deletedUser = await User.findOneAndDelete({ firebaseUID });
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserMaterials = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, topicId } = req.params;
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.status(200).json(topic.categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, name, email } = req.body;
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Creating user with data:', { firebaseUID, name, email });

    // Check if the user already exists
    const existingUser = await User.findOne({ firebaseUID });
    console.log('Existing user check result:', existingUser);

    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create a new user
    const newUser = await User.create({
      firebaseUID,
      name,
      email,
      bio: "Introduce yourself",
      materials: []
    });

    console.log('New user created:', newUser);
    
    // 確認用戶是否真的被保存到數據庫
    const savedUser = await User.findOne({ firebaseUID });
    console.log('Saved user verification:', savedUser);

    return res.status(201).json(newUser);
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    // 添加更詳細的錯誤信息
    res.status(500).json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace available' 
    });
  }
};

export const addMaterial = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, topicId } = req.params;
    const { type, title, url, rating } = req.body;
    
    if (!firebaseUID || !topicId) {
      return res.status(400).json({ 
        error: 'Missing required params'
      });
    }

    // Create new material
    const newMaterial = {
      type,
      title,
      url: url || null,
      rating: rating || 5,
      dateAdded: new Date()
    };

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // First, add the material to the topic
    let user = await User.findOneAndUpdate(
      { 
        firebaseUID,
        'topics._id': topicId
      },
      { 
        $push: { [`topics.$.categories.${type}`]: newMaterial }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User or topic not found' });
    }

    // Then, handle the contribution count
    const existingContribution = user.contributions?.find(c => c.date === today);

    if (existingContribution) {
      // Update existing contribution
      user = await User.findOneAndUpdate(
        { 
          firebaseUID,
          'contributions.date': today
        },
        { 
          $inc: { 'contributions.$.count': 1 }
        },
        { new: true }
      );
    } else {
      // Create new contribution for today
      user = await User.findOneAndUpdate(
        { firebaseUID },
        { 
          $push: { 
            contributions: { 
              date: today, 
              count: 1 
            }
          }
        },
        { new: true }
      );
    }

    // Clean up old contributions (older than 9 months)
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    const cutoffDate = nineMonthsAgo.toISOString().split('T')[0];

    user = await User.findOneAndUpdate(
      { firebaseUID },
      {
        $pull: {
          contributions: {
            date: { $lt: cutoffDate }
          }
        }
      },
      { new: true }
    );

    res.status(200).json(user);
  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 更新用户资料
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    const { name, bio, photoURL } = req.body;
        
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      { $set: { name, bio, photoURL } },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 添加新主题
export const addTopic = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Topic name is required' });
    }
    
    const newTopic = {
      name,
      categories: {
        webpage: [],
        video: [],
        book: [],
        podcast: []
      },
      createdAt: new Date()
    };
    
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      { $push: { topics: newTopic } },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404)
        .set('Content-Type', 'application/json')
        .json({ error: 'User not found' });
    }
    
    res.status(201)
      .set('Content-Type', 'application/json')
      .json(updatedUser);
  } catch (error) {
    console.error('Error adding topic:', error);
    res.status(500)
      .set('Content-Type', 'application/json')
      .json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
  }
};

// 更新主题名称
export const updateTopicName = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, topicId } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400)
        .set('Content-Type', 'application/json')
        .json({ error: 'Topic name is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { 
        firebaseUID,
        'topics._id': topicId 
      },
      { 
        $set: { 'topics.$.name': name }
      },
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedUser) {
      return res.status(404)
        .set('Content-Type', 'application/json')
        .json({ error: 'User or topic not found' });
    }
    
    res.status(200)
      .set('Content-Type', 'application/json')
      .json(updatedUser);
  } catch (error) {
    console.error('Error updating topic name:', error);
    res.status(500)
      .set('Content-Type', 'application/json')
      .json({ 
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { firebaseUID } = req.params;
    
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: 'Database connection not ready' });
    }

    const user = await User.findOne({ firebaseUID })
      .select('firebaseUID name email bio materials')  // 只選擇需要的字段
      .maxTimeMS(3000)                                // 降低查詢超時時間
      .lean()                                         // 使用 lean() 提高性能
      .exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateAllUsersBio = async (req: Request, res: Response) => {
  try {
    // Update all users without a bio field
    const result = await User.updateMany(
      { bio: { $exists: false } },
      { $set: { bio: "Introduce yourself" } }
    );

    res.status(200).json({
      message: 'Bio fields updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating users bio:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const handleContribution = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const nineMonthsAgo = new Date();
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
  const cutoffDate = nineMonthsAgo.toISOString().split('T')[0];

  // Update today's contribution count
  await User.findOneAndUpdate(
    { 
      firebaseUID: userId,
      'contributions.date': today 
    },
    { 
      $inc: { 'contributions.$.count': 1 }
    },
    { 
      new: true 
    }
  );

  // If no contribution record exists for today, create one
  const userWithContribution = await User.findOne({
    firebaseUID: userId,
    'contributions.date': today
  });

  if (!userWithContribution) {
    await User.findOneAndUpdate(
      { firebaseUID: userId },
      {
        $push: { contributions: { date: today, count: 1 } }
      }
    );
  }

  // Clean up old contributions
  await User.findOneAndUpdate(
    { firebaseUID: userId },
    {
      $pull: {
        contributions: {
          date: { $lt: cutoffDate }
        }
      }
    }
  );
};

export const completeMaterial = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, topicId, materialId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const topic = user.topics.find(t => t._id?.toString() === topicId);
    if (!topic || !topic.categories) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const categoryTypes = ['webpage', 'video', 'podcast', 'book'] as const;
    
    for (const type of categoryTypes) {
      const materials = topic.categories[type];
      if (!Array.isArray(materials)) continue;

      const material = materials.find(m => m._id?.toString() === materialId);
      if (material) {
        const isCurrentlyCompleted = material.completed || false;
        const studyCountChange = isCurrentlyCompleted ? -1 : 1; // Decrease if uncompleting, increase if completing

        // Update material completion status and contribution count
        const updatePath = `topics.$[topic].categories.${type}.$[material].completed`;
        const updatedUser = await User.findOneAndUpdate(
          { 
            firebaseUID,
            'topics._id': topicId,
            'contributions.date': today
          },
          { 
            $set: { [updatePath]: !isCurrentlyCompleted },
            $inc: { 'contributions.$[contrib].studyCount': studyCountChange }
          },
          {
            arrayFilters: [
              { 'topic._id': topicId },
              { 'material._id': materialId },
              { 'contrib.date': today }
            ],
            new: true
          }
        );

        if (!updatedUser) {
          // If no contribution exists for today, create one
          const userWithNewContrib = await User.findOneAndUpdate(
            { firebaseUID },
            {
              $set: { [updatePath]: !isCurrentlyCompleted },
              $push: {
                contributions: {
                  date: today,
                  count: 0,
                  studyCount: studyCountChange > 0 ? 1 : 0
                }
              }
            },
            {
              arrayFilters: [
                { 'topic._id': topicId },
                { 'material._id': materialId }
              ],
              new: true
            }
          );
          return res.status(200).json(userWithNewContrib);
        }

        return res.status(200).json(updatedUser);
      }
    }

    return res.status(404).json({ message: 'Material not found' });
  } catch (error) {
    console.error('Error in completeMaterial:', error);
    res.status(500).json({ message: 'Error updating material status' });
  }
};

export const uncompleteMaterial = async (req: Request, res: Response) => {
  try {
    const { firebaseUID, topicId, materialId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.find(t => t._id?.toString() === topicId);
    if (!topic || !topic.categories) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const categoryTypes = ['webpage', 'video', 'podcast', 'book'] as const;
    
    for (const type of categoryTypes) {
      const materials = topic.categories[type];
      if (!Array.isArray(materials)) continue;

      const material = materials.find(m => m._id?.toString() === materialId);
      if (material) {
        // Update material completion status and decrement study count
        const updatePath = `topics.$[topic].categories.${type}.$[material].completed`;
        const updatedUser = await User.findOneAndUpdate(
          { 
            firebaseUID,
            'topics._id': topicId,
            'contributions.date': today
          },
          { 
            $set: { [updatePath]: false },
            $inc: { 'contributions.$[contrib].studyCount': -1 }
          },
          {
            arrayFilters: [
              { 'topic._id': topicId },
              { 'material._id': materialId },
              { 'contrib.date': today }
            ],
            new: true
          }
        );

        if (!updatedUser) {
          // If no contribution exists for today, create one with zero counts
          const userWithNewContrib = await User.findOneAndUpdate(
            { firebaseUID },
            {
              $set: { [updatePath]: false },
              $push: {
                contributions: {
                  date: today,
                  count: 0,
                  studyCount: 0
                }
              }
            },
            {
              arrayFilters: [
                { 'topic._id': topicId },
                { 'material._id': materialId }
              ],
              new: true
            }
          );
          return res.status(200).json(userWithNewContrib);
        }

        // Ensure studyCount doesn't go below 0
        if (updatedUser.contributions) {
          const todayContrib = updatedUser.contributions.find(c => c.date === today);
          if (todayContrib && todayContrib.studyCount < 0) {
            await User.findOneAndUpdate(
              { 
                firebaseUID,
                'contributions.date': today
              },
              { 
                $set: { 'contributions.$.studyCount': 0 }
              }
            );
          }
        }

        return res.status(200).json(updatedUser);
      }
    }

    return res.status(404).json({ error: 'Material not found' });
  } catch (error) {
    console.error('Error in uncompleteMaterial:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { name } = req.body;
    const user = await User.findOne({ firebaseUID: req.user?.uid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topic = user.topics.find(t => t._id?.toString() === topicId);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    topic.name = name;
    await user.save();

    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: 'Error updating topic' });
  }
};