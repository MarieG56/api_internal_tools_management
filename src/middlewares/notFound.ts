import type { Request, Response } from "express";

const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.originalUrl} does not exist`,
  });
};

export default notFound;
