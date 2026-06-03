import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

interface ProviderRequest {
  specialization: string;
  license_number: string;
  license_expiry: string;
  bio: string;
}

// Get all providers
router.get('/', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [providers] = await connection.execute(`
      SELECT p.*, u.full_name, u.email, u.phone_number, u.avatar_url
      FROM providers p
      JOIN users u ON p.user_id = u.id
      WHERE p.verification_status = 'verified'
      ORDER BY p.rating DESC
    `);

    connection.release();

    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get provider details
router.get('/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const connection = await pool.getConnection();

    const [providers] = await connection.execute(`
      SELECT p.*, u.full_name, u.email, u.phone_number, u.avatar_url
      FROM providers p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [providerId]);

    if ((providers as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Provider not found' });
    }

    const [services] = await connection.execute(`
      SELECT s.*, ps.provider_price, ps.experience_years
      FROM services s
      JOIN provider_services ps ON s.id = ps.service_id
      WHERE ps.provider_id = ?
    `, [providerId]);

    connection.release();

    res.json({
      provider: (providers as any[])[0],
      services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register as provider
router.post('/register', authMiddleware, async (req: Request<{}, {}, ProviderRequest>, res: Response) => {
  try {
    const { specialization, license_number, license_expiry, bio } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();

    // Check if already a provider
    const [existing] = await connection.execute(
      'SELECT id FROM providers WHERE user_id = ?',
      [user_id]
    );

    if ((existing as any[]).length > 0) {
      connection.release();
      return res.status(409).json({ error: 'User is already a provider' });
    }

    const provider_id = uuidv4();
    await connection.execute(
      `INSERT INTO providers (id, user_id, specialization, license_number, license_expiry, bio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [provider_id, user_id, specialization, license_number, license_expiry, bio]
    );

    // Update user role
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['provider', user_id]
    );

    connection.release();

    res.status(201).json({
      message: 'Provider registered successfully',
      provider_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
