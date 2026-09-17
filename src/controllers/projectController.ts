import { raw, Request, Response } from "express";
import { pool } from "../config/db";

async function resolvedTagId(client: any, item: any): Promise<number | null> {
  if (typeof item === 'number') {
    return item;
  }

  if (typeof item === 'string' && !isNaN(Number(item))) {
    return Number(item);
  }

  if (typeof item === 'object' && item !== null && item.id && !isNaN(Number(item.id))) {
    return Number(item.id);
  }

  let tagName = '';
  let tagColor = '#3b82f6';

  if (typeof item === 'string') {
    tagName = item.trim();
  } else if (typeof item === 'object' && item !== null && item.name) {
    tagName = String(item.name).trim();
    tagColor = item.color_hex || '#3b82f6';
  }

  if (!tagName) return null;
  
  const tagUpsertQuery = `
    INSERT INTO tags (name, color_hex)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE
    SET color_hex = COALESCE(EXCLUDED.color_hex, tags.color_hex)
    RETURNING id;
  `;

  const res = await client.query(tagUpsertQuery, [tagName, tagColor]);
  return res.rows[0]?.id ? Number(res.rows[0].id) : null;
}

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

    // Insert project
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
      summary || null,
      description_markdown || null,
      image_url || null,
      github_url || null,
      live_url || null,
      is_featured || false
    ]);

    const createdProject = projectResult.rows[0];

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const item of tags) {

        const tagId = await resolvedTagId(client, item);

        if (tagId !== null) {
          await client.query(
            `INSERT INTO project_tags (project_id, tag_id) 
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
            `,
            [createdProject.id, tagId]
          );
        }
      }
    }

    await client.query('COMMIT');

    const fetchCreated = await client.query(
      `
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
      WHERE p.id = $1
      GROUP BY p.id;
    `,
      [createdProject.id]
    );

    res.status(201).json({ 
      message: 'Project created successfully',
      data: fetchCreated.rows[0]
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

export const updateProject = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
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

    const updateProjectQuery = `
      UPDATE projects
      SET 
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        summary = COALESCE($3, summary),
        description_markdown = COALESCE($4, description_markdown),
        image_url = $5,
        github_url = $6,
        live_url = $7,
        is_featured = COALESCE($8, is_featured)
      WHERE id = $9
      RETURNING *;
    `;

    const projectResult = await client.query(updateProjectQuery, [
      title || null,
      slug || null,
      summary || null,
      description_markdown || null,
      image_url !== undefined ? image_url : null,
      github_url !== undefined ? github_url : null,
      live_url !== undefined ? live_url : null,
      is_featured !== undefined ? is_featured : null,
      id
    ]);

    if (projectResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Project not found' });
    }

    if (tags && Array.isArray(tags)) {
      await client.query('DELETE FROM project_tags WHERE project_id = $1', [id]);

      for (const item in tags) {
        const tagId = await resolvedTagId(client, item);

        if (tagId !== null) {
          await client.query(
            `INSERT INTO project_tags (project_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
            `,
            [id, tagId]
          );
        }
      }
    }

    await client.query('COMMIT');

    const fetchUpdated = await client.query(
      `
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
      WHERE p.id = $1
      GROUP BY p.id;
      `,
      [id]
    );

    res.status(200).json({
      message: 'Project updated successfully',
      data: fetchUpdated.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}