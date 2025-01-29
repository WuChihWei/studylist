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
    const { firebaseUID } = req.params;
    const user = await User.findOne({ firebaseUID });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user.materials);
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
    const { firebaseUID } = req.params;
    const { type, title, rating } = req.body;

    // 驗證必要欄位
    if (!type || !title || rating === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'title', 'rating']
      });
    }

    // 驗證類型是否合法
    if (!['webpage','book', 'video', 'podcast'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid material type',
        allowedTypes: ['webpage','book', 'video', 'podcast']
      });
    }

    const newMaterial = {
      type,
      title,
      rating,
      dateAdded: new Date()
    };

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUID },
      { $push: { materials: newMaterial } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(201).json({
      message: 'Material added successfully',
      material: newMaterial,
      materials: updatedUser.materials
    });

  } catch (error) {
    console.error('Error adding material:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};