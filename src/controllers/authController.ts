import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    res.status(200).json({ token: data.session?.access_token });  
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};