import { Router, Request, Response } from 'express';
import pool from '../db/connection.js';

const router = Router();

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [services] = await connection.execute(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY category, name'
    );

    connection.release();

    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get services by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const connection = await pool.getConnection();

    const [services] = await connection.execute(
      'SELECT * FROM services WHERE category = ? AND is_active = TRUE ORDER BY name',
      [category]
    );

    connection.release();

    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service details
router.get('/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const connection = await pool.getConnection();

    const [services] = await connection.execute(
      'SELECT * FROM services WHERE id = ?',
      [serviceId]
    );

    connection.release();

    if ((services as any[]).length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json((services as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
