import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "config";

function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("access denied. No token provided");

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
}

export { auth };
