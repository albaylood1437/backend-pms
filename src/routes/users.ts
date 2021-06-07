import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import _ from "lodash";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { auth } from "../middleware/auth";
import config from "config";

const prisma = new PrismaClient();
const users: Router = Router();

users.get("/me", auth, async (req: any, res: any) => {
  const user = await prisma.users.findUnique({
    where: { userId: req.user.userId },
    select: { username: true, email: true },
  });

  res.send(user);
});

users.post("/", async (req: Request, res: Response) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await prisma.users.findUnique({
    where: { email: req.body.email },
  });
  if (user) return res.status(400).send("User already registered");

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  user = await prisma.users.create({
    data: _.pick(req.body, ["username", "email", "password", "isAdmin"]),
  });

  const token = jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    config.get("jwtPrivateKey")
  );

  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["userId", "username", "email", "password", "isAdmin"]));
});

users.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const user = await prisma.users.update({
      where: { userId: Number(id) },
      data: {
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        isAdmin: req.body.isAdmin,
      },
    });
    res.send(user);
  } catch (err) {
    res.status(404).send("User with the given id was not found");
  }
});

users.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.delete({
      where: { userId: Number(id) },
    });
    res.send(user);
  } catch (err) {
    res.status(404).send(`User with the id: ${id}, was not found`);
  }
});

function validateUser(req: Request) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(50).required(),
    isAdmin: Joi.string().required(),
  });
  return schema.validate(req);
}

export default users;
