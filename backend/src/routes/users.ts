import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

interface UpdateProfileRequest {
  bio?: string;
  location?: string;
  date_of_birth?: string;
  gender?: string;
  medical_history?: string;
  allergies?: string;
}

// Get user profile
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, email, full_name, phone_number, avatar_url, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if ((users as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const [profiles] = await connection.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    connection.release();

    const user = (users as any[])[0];
    const profile = (profiles as any[])[0];

    res.json({
      user,
      profile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:userId', authMiddleware, async (req: Request<{ userId: string }, {}, UpdateProfileRequest>, res: Response) => {
  try {
    const { userId } = req.params;
    const { bio, location, date_of_birth, gender, medical_history, allergies } = req.body;

    const connection = await pool.getConnection();

    const [profiles] = await connection.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if ((profiles as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User profile not found' });
    }

    await connection.execute(
      `UPDATE user_profiles SET bio = ?, location = ?, date_of_birth = ?, gender = ?, 
       medical_history = ?, allergies = ? WHERE user_id = ?`,
      [bio, location, date_of_birth, gender, medical_history, allergies, userId]
    );

    connection.release();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
