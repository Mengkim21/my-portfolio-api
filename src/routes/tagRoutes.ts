import { Router } from "express";
import { getAlltags, createTag } from "../controllers/tagController";
import { isAdmin } from "../middleware/authMiddleware";

const router = Router();

// Public
router.get('/', getAlltags);

// Protected (requires an admin JWT)
router.post('/', isAdmin, createTag);

export default router;