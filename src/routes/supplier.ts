import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const supplier: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  supplierName: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, supplierName, totalPages, currentPage };
};

supplier.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const supplier = await prisma.supplier.findMany({
      take: Number(limit),
      skip: Number(offset),
    });
    const totalItems = await prisma.supplier.count();
    const data = getPagingData(supplier as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any supplier");
  }
});

supplier.post("/", async (req: Request, res: Response) => {
  const { error } = validateSupplier(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const supplier = await prisma.supplier.create({
      data: { supplierName: req.body.supplierName },
    });
    return res.json(supplier);
  } catch (error) {
    res.status(500).send("internal error accrued while saving supplier");
  }
});

supplier.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = validateSupplier(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const supplier = await prisma.supplier.update({
      where: { supplierId: Number(id) },
      data: { supplierName: req.body.supplierName },
    });
    return res.json(supplier);
  } catch (error) {
    res.status(404).send("supplier with given ID was not found");
  }
});

supplier.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const supplier = await prisma.supplier.delete({
      where: { supplierId: Number(id) },
    });
    return res.json(supplier);
  } catch (error) {
    res.status(500).send(`supplier with the id: ${id}, was not found`);
  }
});

function validateSupplier(req: Request) {
  const schema = Joi.object({
    supplierName: Joi.string().min(2).max(40).required(),
  });
  return schema.validate(req);
}

export default supplier;
