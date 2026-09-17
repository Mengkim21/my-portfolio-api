import { Router } from "express";
import { createProject, deleteProject, getAllProjects, updateProject } from "../controllers/projectController";
import { isAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public
router.get('/', getAllProjects);

// Admin only
router.post('/', isAdmin, createProject);
router.put('/:id', isAdmin, updateProject);
router.delete('/:id', isAdmin, deleteProject);

export default router;