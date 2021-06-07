import { Request, Response, NextFunction } from "express";

function admin(req: Request, res: Response, next: NextFunction) {
  const admin = (req as any).user.isAdmin;
  if (admin === "admin") {
    next();
  } else if (admin === "procurement") {
    next();
  } else {
    return res.status(403).send("Access denied");
  }
}

export { admin };
