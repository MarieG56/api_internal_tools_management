import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import {
  departmentCostsHandler,
  expensiveToolsHandler,
  lowUsageToolsHandler,
  toolsByCategoryHandler,
  vendorSummaryHandler,
} from "../controllers/analyticsController.js";

const router = Router();

router.get("/department-costs", asyncHandler(departmentCostsHandler));
router.get("/expensive-tools", asyncHandler(expensiveToolsHandler));
router.get("/tools-by-category", asyncHandler(toolsByCategoryHandler));
router.get("/low-usage-tools", asyncHandler(lowUsageToolsHandler));
router.get("/vendor-summary", asyncHandler(vendorSummaryHandler));

export default router;
