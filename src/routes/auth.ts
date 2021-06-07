import { Router, Request } from "express";
import { PrismaClient } from "@prisma/client";
import config from "config";
import Joi from "joi";
import _ from "lodash";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const auth: Router = Router();

auth.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await prisma.users.findUnique({
    where: { email: req.body.email },
  });
  if (!user) return res.status(400).send("Invalid email or password");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password");

  const token = jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      email: user.email,
      admin: user.isAdmin,
    },
    config.get("jwtPrivateKey")
  );

  res.send(token);
});

function validateUser(req: Request) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(50).required(),
  });
  return schema.validate(req);
}

export default auth;
