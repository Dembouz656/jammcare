import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

interface CreateBookingRequest {
  provider_id: string;
  service_id: string;
  appointment_date: string;
  location?: string;
  notes?: string;
}

// Create booking
router.post('/', authMiddleware, async (req: Request<{}, {}, CreateBookingRequest>, res: Response) => {
  try {
    const { provider_id, service_id, appointment_date, location, notes } = req.body;
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();

    const booking_id = uuidv4();
    await connection.execute(
      `INSERT INTO bookings (id, user_id, provider_id, service_id, appointment_date, location, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [booking_id, user_id, provider_id, service_id, appointment_date, location, notes]
    );

    connection.release();

    res.status(201).json({
      message: 'Booking created successfully',
      booking_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookings
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const connection = await pool.getConnection();

    const [bookings] = await connection.execute(`
      SELECT b.*, s.name as service_name, u.full_name as provider_name, u.avatar_url as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.appointment_date DESC
    `, [userId]);

    connection.release();

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get provider bookings
router.get('/provider/:providerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;

    const connection = await pool.getConnection();

    const [bookings] = await connection.execute(`
      SELECT b.*, s.name as service_name, u.full_name as user_name, u.email as user_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE b.provider_id = ?
      ORDER BY b.appointment_date DESC
    `, [providerId]);

    connection.release();

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.patch('/:bookingId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    connection.release();

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
