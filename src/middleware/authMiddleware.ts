import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import dotenv from 'dotenv';

dotenv.config();

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required!' });
    }

    const { data: {user}, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const adminId = process.env.ADMIN_UUID as string;
    if (user.id !== adminId) {
      return res.status(403).json({ error: 'Access denied: Admin only' });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}