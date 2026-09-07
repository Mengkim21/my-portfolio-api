import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tags (id, name, color_hex)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({
      message: 'Successful retrieve all projects',
      data
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { tags, ...projectData } = req.body;

    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    
    if (pError) throw pError;

    if (tags && tags.length > 0) {
      const tagLinks = tags.map((tagId: number) => ({
        project_id: project.id,
        tag_id: tagId,
      }));

      const { error: tError } = await supabase
        .from('project_tags')
        .insert(tagLinks);
        
      if (tError) throw tError;
    }

    res.status(201).json({ ...projectData, tags });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};