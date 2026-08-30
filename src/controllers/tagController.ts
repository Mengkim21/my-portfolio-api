import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getAlltags = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.status(200).json({
      message: "Successfully retrieve all tags",
      data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, color_hex } = req.body;

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name, color_hex }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}