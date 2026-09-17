import { Router } from "express";
import { getAlltags, createTag, updateTag, deleteTag } from "../controllers/tagController";
import { isAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public
router.get('/', getAlltags);

// Protected (requires an admin JWT)
router.post('/', isAdmin, createTag);
router.put('/:id', isAdmin, updateTag);
router.delete('/:id', isAdmin, deleteTag);

export default router;