import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const garage: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  garageName: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, garageName, totalPages, currentPage };
};

garage.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const garage = await prisma.garage.findMany({
      take: Number(limit),
      skip: Number(offset),
    });
    const totalItems = await prisma.garage.count();
    const data = getPagingData(garage as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any garage");
  }
});

garage.post("/", async (req: Request, res: Response) => {
  const { error } = validateGarage(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const garage = await prisma.garage.create({
      data: { garageName: req.body.garageName },
    });
    return res.json(garage);
  } catch (error) {
    res.status(500).send("internal error ocurred while saving garage");
  }
});

garage.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = validateGarage(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const garage = await prisma.garage.update({
      where: { garageId: Number(id) },
      data: { garageName: req.body.garageName },
    });
    return res.json(garage);
  } catch (error) {
    res.status(404).send("garage with given ID was not found");
  }
});

garage.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const garage = await prisma.garage.delete({
      where: { garageId: Number(id) },
    });
    return res.json(garage);
  } catch (error) {
    res.status(500).send(`Garage with the id: ${id}, was not found`);
  }
});

function validateGarage(req: Request) {
  const schema = Joi.object({
    garageName: Joi.string().min(2).max(40).required(),
  });
  return schema.validate(req);
}

export default garage;
