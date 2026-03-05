import { Router } from "express";
import {
  createToolHandler,
  getToolByIdHandler,
  listToolsHandler,
  updateToolHandler,
} from "../controllers/toolController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listToolsHandler));
router.get("/:id", asyncHandler(getToolByIdHandler));
router.post("/", asyncHandler(createToolHandler));
router.put("/:id", asyncHandler(updateToolHandler));

export default router;
