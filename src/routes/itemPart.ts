import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import serviceExpense from "./serviceExpense";

const prisma = new PrismaClient();

const itemPart: Router = Router();

itemPart.get("/byDriverDate", async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  const fromD = "'" + fromDate + "'";
  const toD = "'" + toDate + "'";
  try {
    const itemPart = await prisma.itemPart.findMany({
      where: {
        serviceExpense: {
          serviceDate: {
            gte: new Date(fromD),
            lt: new Date(toD),
          },
        },
      },
      include: { serviceExpense: true, supplier: true },
    });
    res.send(itemPart);
  } catch (error) {
    res.status(404).send("can,t find any itemPart");
  }
});

itemPart.get("/byDriver", async (req: Request, res: Response) => {
  const { licence } = req.query;

  try {
    const searchingDriver = await prisma.drivers.findMany({
      where: { licensNo: Number(licence) },
    });

    if (!searchingDriver)
      return res.status(400).send(`supplier with ${licence} id was not found`);

    const driver = await prisma.drivers.findMany({
      where: { licensNo: Number(licence) },
    });

    if (driver.length === 0) {
      return res.status(400).send(`supplier with ${licence} id was not found`);
    } else {
      const assign = await prisma.driving.findMany({
        where: { driverId: Number(driver[0].driverId) },
      });
      if (assign == null) return res.status(400).send("invalid");
      const itemPart = await prisma.itemPart.findMany({
        where: {
          serviceExpense: {
            vehicle: { vehicleId: Number(assign[0].vehicleId) },
          },
        },
        include: { serviceExpense: true, supplier: true },
      });
      const response = {
        res: itemPart,
        vehicleID: assign[0].vehicleId,
      };
      res.send(response);
    }
  } catch (error) {
    res.status(500).send("internal error accrued while saving ItemPart");
  }
});

itemPart.get("/byVehicle", async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const itemPart = await prisma.itemPart.findMany({
      where: { serviceExpense: { vehicleId: Number(id) } },
      include: { serviceExpense: true, supplier: true },
    });
    res.send(itemPart);
  } catch (error) {
    res.status(404).send("can,t find any itemPart");
  }
});

itemPart.get("/", async (req: Request, res: Response) => {
  try {
    const itemPart = await prisma.itemPart.findMany({
      include: { serviceExpense: true, supplier: true },
    });
    res.send(itemPart);
  } catch (error) {
    res.status(404).send("can,t find any itemPart");
  }
});

itemPart.post("/", async (req: Request, res: Response) => {
  const { supplierName, garageName, id } = req.body;
  try {
    const service = await prisma.serviceExpense.findUnique({
      where: { id: Number(id) },
    });

    if (service === null)
      return res.status(400).send(`supplier with ${id} id was not found`);

    const supplier = await prisma.supplier.findUnique({
      where: { supplierId: Number(supplierName) },
    });

    if (supplier === null)
      return res
        .status(400)
        .send(`supplier with ${supplierName} id was not found`);

    const { error } = validateitemPart(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const itemPart = await prisma.itemPart.create({
      data: {
        itemPart: req.body.itemPart,
        partName: req.body.partName,
        partQuantity: Number(req.body.partQuantity),
        partPrice: Number(req.body.partPrice),
        serviceExpense: { connect: { id: Number(id) } },
        supplier: { connect: { supplierId: Number(supplierName) } },
      },
      include: {
        serviceExpense: true,
        supplier: true,
      },
    });

    return res.json(itemPart);
  } catch (error) {
    res.status(500).send("internal error accrued while saving itemPart");
  }
});

itemPart.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { supplierId } = req.body;
  const { error } = validateitemPartUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const itemPart = await prisma.itemPart.update({
      where: { itemPart: id },
      data: {
        partName: req.body.partName,
        partQuantity: req.body.partQuantity,
        partPrice: req.body.partPrice,
        supplier: { connect: { supplierId: Number(supplierId) } },
      },
      include: { supplier: true, serviceExpense: true },
    });

    return res.json(itemPart);
  } catch (error) {
    res.status(404).send("itemPart with given ID was not found");
  }
});

itemPart.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const itemPart = await prisma.itemPart.delete({
      where: { itemPart: id },
    });
    return res.json(itemPart);
  } catch (error) {
    res.status(500).send(`itemPart with the id: ${id}, was not found`);
  }
});

function validateitemPart(req: Request) {
  const schema = Joi.object({
    itemPart: Joi.string().required(),
    partName: Joi.string().min(2).max(40).required(),
    partQuantity: Joi.number().required(),
    partPrice: Joi.number().required(),
    id: Joi.number().required(),
    supplierName: Joi.number().required(),
  });
  return schema.validate(req);
}

function validateitemPartUpdate(req: Request) {
  const schema = Joi.object({
    partName: Joi.string().min(2).max(40).required(),
    partQuantity: Joi.number().required(),
    partPrice: Joi.number().required(),
    supplierId: Joi.number().required(),
  });
  return schema.validate(req);
}

export default itemPart;
