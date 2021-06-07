import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const serviceExpense: Router = Router();

// serviceExpense.get("/byDepartment", async (req: Request, res: Response) => {
//   try {
//     const serviceExpense = await prisma.serviceExpense.findMany({
//       where: {
//         vehicleId: 23,
//       },
//       // include: {
//       //   vehicle: { include: { department: true } },
//       //   supplier: true,
//       //   garage: true,
//     });
//     const reducer = (accumulator: any, currentValue: any) =>
//       accumulator + currentValue;
//     const ser = serviceExpense.map((s: any) => s.partCost);
//     console.log(ser.reduce(reducer));

//     const vehicle = serviceExpense.filter((v: any) => v.partCost);

//     return res.json(serviceExpense);
//   } catch (error) {
//     res.status(404).send("can,t find any serviceExpense");
//   }
// });

serviceExpense.get("/partDate", async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  const fromD = "'" + fromDate + "'";
  const toD = "'" + toDate + "'";
  try {
    const serviceExpense = await prisma.serviceExpense.findMany({
      where: {
        serviceDate: {
          gte: new Date(fromD),
          lt: new Date(toD),
        },
      },
      include: { itemPart: true, vehicle: true, garage: true },
    });
    res.send(serviceExpense);
  } catch (error) {
    res.status(404).send("can,t find any serviceExpense");
  }
});

serviceExpense.get("/", async (req: Request, res: Response) => {
  try {
    const serviceExpense = await prisma.serviceExpense.findMany({
      include: {
        vehicle: true,
        itemPart: true,
        garage: true,
      },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(404).send("can,t find any serviceExpense");
  }
});

serviceExpense.post("/", async (req: Request, res: Response) => {
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

    const { error } = validateServiceExpense(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let serviceExpense = await prisma.serviceExpense.findUnique({
      where: { invoiceNumber: req.body.invoiceNumber },
    });
    if (serviceExpense)
      return res.status(400).send("Invoice already registered");

    serviceExpense = await prisma.serviceExpense.create({
      data: {
        invoiceNumber: req.body.invoiceNumber,
        serviceDescription: req.body.serviceDescription,
        serviceDate: req.body.serviceDate,
        serviceCost: req.body.serviceCost,
        totalCost: req.body.totalCost,
        purchaseID: req.body.purchaseID,
        vehicle: { connect: { vehicleId: vehicleId } },
        garage: { connect: { garageId: Number(garageId) } },
      },
      include: {
        vehicle: true,
        garage: true,
      },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(500).send("internal error accrued while saving serviceExpense");
  }
});

serviceExpense.put("/updateTotals/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const service = await prisma.serviceExpense.findUnique({
      where: { id: Number(id) },
    });

    if (service === null)
      return res.status(400).send(`stock with the id: ${id}, was not found`);
    const serviceExpense = await prisma.serviceExpense.update({
      where: { id: Number(id) },
      data: {
        totalCost: service.totalCost! + req.body.totalCost,
      },
      include: { vehicle: true, garage: true },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(404).send(`serviceExpense with given ${id} ID was not found`);
  }
});

serviceExpense.put("/updateTotal/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("id", id);
  try {
    const service = await prisma.serviceExpense.findUnique({
      where: { id: Number(id) },
    });

    if (service === null)
      return res.status(400).send(`stock with the id: ${id}, was not found`);
    const serviceExpense = await prisma.serviceExpense.update({
      where: { id: Number(id) },
      data: {
        totalCost: service.totalCost! - req.body.totalCost,
      },
      include: { vehicle: true, garage: true },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(404).send(`serviceExpense with given ${id} ID was not found`);
  }
});

serviceExpense.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { vehicleId, garageId } = req.body;
  try {
    const serviceExpense = await prisma.serviceExpense.update({
      where: { id: Number(id) },
      data: {
        serviceDescription: req.body.serviceDescription,
        serviceDate: req.body.serviceDate,
        serviceCost: req.body.serviceCost,
        purchaseID: req.body.purchaseID,
        totalCost: req.body.totalCost,
        vehicle: { connect: { vehicleId: Number(vehicleId) } },
        garage: { connect: { garageId: Number(garageId) } },
      },
      include: { vehicle: true, garage: true },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(404).send(`serviceExpense with given ${id} ID was not found`);
  }
});

serviceExpense.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const serviceExpense = await prisma.serviceExpense.delete({
      where: { id: Number(id) },
    });
    return res.json(serviceExpense);
  } catch (error) {
    res.status(500).send(`serviceExpense with the id: ${id}, was not found`);
  }
});

function validateServiceExpense(req: Request) {
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

function validateServiceExpenseEdit(req: Request) {
  const schema = Joi.object({
    serviceDescription: Joi.string().optional(),
    serviceDate: Joi.date().required(),
    serviceCost: Joi.number().required(),
    purchaseID: Joi.number().required(),
    totalCost: Joi.number().required(),
    vehicleId: Joi.number().required(),
    garageId: Joi.number().required(),
  });
  return schema.validate(req);
}

export default serviceExpense;
