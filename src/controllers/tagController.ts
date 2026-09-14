import { Request, Response } from "express";
import { pool } from "../config/db";

export const getAlltags = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY name DESC');
    
    res.status(200).json({
      message: "Successfully retrieve all tags",
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color_hex } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tags (name, color_hex) VALUES ($1, $2) RETURNING *',
      [name, color_hex || '#3b82f6']
    );

    res.status(201).json({
      message: 'Tag created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}