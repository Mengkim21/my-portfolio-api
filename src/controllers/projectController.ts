import { Request, Response } from "express";
import { pool } from "../config/db";

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color_hex', t.color_hex)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags
      FROM projects p
      LEFT JOIN project_tags pt ON p.id = pt.project_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const result = await pool.query(query);

    res.status(200).json({
      message: 'Successful retrieve all projects',
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { 
      title,
      slug,
      summary,
      description_markdown,
      image_url,
      github_url,
      live_url,
      is_featured,
      tags
    } = req.body;

    await client.query('BEGIN');

    const projectInsertQuery = `
      INSERT INTO projects (
        title, slug, summary, description_markdown,
        image_url, github_url, live_url, is_featured
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const projectResult = await client.query(projectInsertQuery, [
      title,
      slug,
      summary,
      description_markdown,
      image_url || null,
      github_url || null,
      live_url || null,
      is_featured || false
    ]);

    const createdProject = projectResult.rows[0];

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await client.query(
          'INSERT INTO project_tags (project_id, tag_id) VALUES ($1, $2)',
          [createdProject.id, tagId]
        )
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ 
      message: 'Project created successfully',
      data: { ...createdProject, tags}
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};