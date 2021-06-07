import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const driver: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  driverName: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, driverName, totalPages, currentPage };
};

driver.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const driver = await prisma.drivers.findMany({
      take: Number(limit),
      skip: Number(offset),
      include: { driving: true },
    });
    const totalItems = await prisma.drivers.count();
    const data = getPagingData(driver as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any driver");
  }
});

driver.post("/", async (req: Request, res: Response) => {
  try {
    const { error } = validateDriver(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const driver = await prisma.drivers.create({
      data: {
        driverName: req.body.driverName,
        phone: req.body.phone,
        licensNo: req.body.licensNo,
        description: req.body.description,
      },
    });
    return res.json(driver);
  } catch (error) {
    res.status(500).send("internal error accrued while saving driver");
  }
});

driver.put("/driverStatus/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driver = await prisma.drivers.update({
      where: { driverId: Number(id) },
      data: {
        driverStatus: req.body.driverStatus,
      },
    });
    return res.json(driver);
  } catch (error) {
    res.status(404).send("driver with given ID was not found");
  }
});

driver.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = validateDriver(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const driver = await prisma.drivers.update({
      where: { driverId: Number(id) },
      data: {
        driverName: req.body.driverName,
        phone: req.body.phone,
        licensNo: req.body.licensNo,
        description: req.body.description,
      },
    });
    return res.json(driver);
  } catch (error) {
    res.status(404).send("driver with given ID was not found");
  }
});

driver.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const driver = await prisma.drivers.delete({
      where: { driverId: Number(id) },
    });
    return res.json(driver);
  } catch (error) {
    res.status(500).send(`driver with the id: ${id}, was not found`);
  }
});

function validateDriver(req: Request) {
  const schema = Joi.object({
    driverName: Joi.string().required(),
    phone: Joi.string().required(),
    licensNo: Joi.number().required(),
    description: Joi.string().optional(),
  });
  return schema.validate(req);
}

export default driver;
