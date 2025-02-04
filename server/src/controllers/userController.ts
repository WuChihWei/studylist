import { Request, Response } from 'express';
import { User } from '../models/User';

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
    
    console.log('Adding material:', {
      params: req.params,
      body: req.body
    });

    if (!firebaseUID || !topicId) {
      console.error('Missing required params:', { firebaseUID, topicId });
      return res.status(400).json({ 
        error: 'Missing required params',
        required: ['firebaseUID', 'topicId']
      });
    }

    if (!type || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'title']
      });
    }

    const newMaterial = {
      type,
      title,
      url: url || null,
      rating: rating || 5,
      dateAdded: new Date()
    };

    const updatedUser = await User.findOneAndUpdate(
      { 
        firebaseUID,
        'topics._id': topicId 
      },
      { 
        $push: { [`topics.$.categories.${type}`]: newMaterial }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User or topic not found' });
    }

    // 返回完整的更新後用戶資料
    res.status(201).json(updatedUser);
    
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
    
    console.log('Getting user with firebaseUID:', firebaseUID); // 調試用
    
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      console.log('User not found'); // 調試用
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('User found:', user); // 調試用
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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