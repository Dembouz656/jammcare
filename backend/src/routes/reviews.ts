import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

interface CreateReviewRequest {
  booking_id: string;
  rating: number;
  comment?: string;
}

// Create review
router.post('/', authMiddleware, async (req: Request<{}, {}, CreateReviewRequest>, res: Response) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating or user' });
    }

    const connection = await pool.getConnection();

    // Get booking details
    const [bookings] = await connection.execute(
      'SELECT provider_id FROM bookings WHERE id = ?',
      [booking_id]
    );

    if ((bookings as any[]).length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Booking not found' });
    }

    const provider_id = (bookings as any[])[0].provider_id;

    const review_id = uuidv4();
    await connection.execute(
      `INSERT INTO reviews (id, booking_id, user_id, provider_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [review_id, booking_id, user_id, provider_id, rating, comment]
    );

    // Update provider rating
    const [ratings] = await connection.execute(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE provider_id = ?',
      [provider_id]
    );

    const avg_rating = (ratings as any[])[0].avg_rating;
    await connection.execute(
      'UPDATE providers SET rating = ? WHERE id = ?',
      [avg_rating, provider_id]
    );

    connection.release();

    res.status(201).json({
      message: 'Review created successfully',
      review_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get provider reviews
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const connection = await pool.getConnection();

    const [reviews] = await connection.execute(`
      SELECT r.*, u.full_name as reviewer_name, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.provider_id = ?
      ORDER BY r.created_at DESC
    `, [providerId]);

    connection.release();

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
