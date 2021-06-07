import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const part: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  partName: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, partName, totalPages, currentPage };
};

part.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const part = await prisma.part.findMany({
      take: Number(limit),
      skip: Number(offset),
    });
    const totalItems = await prisma.part.count();
    const data = getPagingData(part as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any part");
  }
});

part.post("/", async (req: Request, res: Response) => {
  const { error } = validatePart(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const part = await prisma.part.create({
      data: { partName: req.body.partName },
    });
    return res.json(part);
  } catch (error) {
    res.status(500).send("internal error accrued while saving part");
  }
});

part.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = validatePart(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const part = await prisma.part.update({
      where: { partId: Number(id) },
      data: { partName: req.body.partName },
    });
    return res.json(part);
  } catch (error) {
    res.status(404).send("part with given ID was not found");
  }
});

part.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const part = await prisma.part.delete({
      where: { partId: Number(id) },
    });
    return res.json(part);
  } catch (error) {
    res.status(500).send(`part with the id: ${id}, was not found`);
  }
});

function validatePart(req: Request) {
  const schema = Joi.object({
    partName: Joi.string().min(2).max(40).required(),
  });
  return schema.validate(req);
}

export default part;
