import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const deletedServiceExpense: Router = Router();

deletedServiceExpense.get("/", async (req: Request, res: Response) => {
  try {
    const deletedServiceExpense = await prisma.deletedServiceExpense.findMany({
      include: {
        vehicle: true,
        garage: true,
      },
    });
    return res.json(deletedServiceExpense);
  } catch (error) {
    res.status(404).send("can,t find any deletedServiceExpense");
  }
});

deletedServiceExpense.post("/", async (req: Request, res: Response) => {
  const { vehicleId, garageId } = req.body;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicleId: vehicleId },
    });

    if (vehicle === null)
      return res
        .status(400)
        .send(`vehicle with ${vehicleId} id was not found   `);

    const garage = await prisma.garage.findUnique({
      where: { garageId: Number(garageId) },
    });

    if (garage === null)
      return res
        .status(400)
        .send(`Garage with ${garageId} id was not found    `);

    const { error } = validatedeletedServiceExpense(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const deletedServiceExpense = await prisma.deletedServiceExpense.create({
      data: {
        invoiceNumber: req.body.invoiceNumber,
        serviceDescription: req.body.serviceDescription,
        serviceDate: req.body.serviceDate,
        serviceCost: req.body.serviceCost,
        totalCost: req.body.totalCost,
        purchaseID: Number(req.body.purchaseID),
        vehicle: { connect: { vehicleId: vehicleId } },
        garage: { connect: { garageId: Number(garageId) } },
      },
      include: {
        vehicle: true,
        garage: true,
      },
    });
    return res.json(deletedServiceExpense);
  } catch (error) {
    res
      .status(500)
      .send("internal error accrued while saving deletedServiceExpense");
  }
});

deletedServiceExpense.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedServiceExpense = await prisma.deletedServiceExpense.delete({
      where: { id: Number(id) },
    });
    return res.json(deletedServiceExpense);
  } catch (error) {
    res
      .status(500)
      .send(`deletedServiceExpense with the id: ${id}, was not found`);
  }
});

function validatedeletedServiceExpense(req: Request) {
  const schema = Joi.object({
    invoiceNumber: Joi.number().required(),
    serviceDescription: Joi.string().optional(),
    serviceDate: Joi.date().required(),
    serviceCost: Joi.number().required(),
    totalCost: Joi.number().required(),
    purchaseID: Joi.number().required(),
    vehicleId: Joi.number().required(),
    garageId: Joi.number().required(),
  });
  return schema.validate(req);
}

function validatedeletedServiceExpenseEdit(req: Request) {
  const schema = Joi.object({
    serviceDescription: Joi.string().optional(),
    serviceDate: Joi.date().required(),
    serviceCost: Joi.number().required(),
    purchaseID: Joi.number().required(),
    totalCost: Joi.number().required(),
    vehicleId: Joi.number().required(),
  });
  return schema.validate(req);
}

export default deletedServiceExpense;
