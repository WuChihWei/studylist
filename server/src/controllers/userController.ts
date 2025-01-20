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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};