import { Router, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';

const router = Router();

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: 'user' | 'provider';
}

interface LoginRequest {
  email: string;
  password: string;
}

// Register
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, full_name, phone_number, role = 'user' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcryptjs.hash(password, 10);
    const user_id = uuidv4();

    // Insert user
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, full_name, phone_number, role) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, email, password_hash, full_name, phone_number, role]
    );

    // Create user profile
    const profile_id = uuidv4();
    await connection.execute(
      'INSERT INTO user_profiles (id, user_id) VALUES (?, ?)',
      [profile_id, user_id]
    );

    connection.release();

    res.status(201).json({
      message: 'User registered successfully',
      user_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if ((users as any[]).length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = (users as any[])[0];
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user_id: user.id,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
