import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi, { number } from "joi";

const prisma = new PrismaClient();

const vehicle: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  plateNumber: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, plateNumber, totalPages, currentPage };
};

vehicle.get("/disposed", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 5 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const vehicle = await prisma.vehicle.findMany({
      where: { NOT: { disposalDate: null } },
      take: Number(limit),
      skip: Number(offset),
      include: { department: true },
    });
    const totalItems = vehicle.length;
    const data = getPagingData(vehicle as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any vehicle");
  }
});

vehicle.get("/notDisposed", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const vehicle = await prisma.vehicle.findMany({
      where: { disposalDate: null },
      take: Number(limit),
      skip: Number(offset),
      include: { department: true, driving: true },
    });
    const totalItems = await prisma.vehicle.count();
    const data = getPagingData(vehicle as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any vehicle");
  }
});

vehicle.get("/allVehicle", async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findMany({
      where: { disposalDate: null },
      include: { department: true },
    });
    res.send(vehicle);
  } catch (error) {
    res.status(404).send("can,t find any vehicle");
  }
});

vehicle.get("/allVehicles", async (req: Request, res: Response) => {
  const locations = String(req.query.department);
  try {
    const vehicle = await prisma.vehicle.findMany({
      where: {
        department: { departmentName: locations },
      },
      include: { department: true },
    });
    res.send(vehicle);
  } catch (error) {
    res.status(404).send("can,t find any vehicle");
  }
});

vehicle.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const vehicle = await prisma.vehicle.findMany({
      take: Number(limit),
      skip: Number(offset),
      include: { department: true, driving: true },
    });
    const totalItems = await prisma.vehicle.count();
    const data = getPagingData(vehicle as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any vehicle");
  }
});

vehicle.post("/", async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.body;

    const department = await prisma.department.findUnique({
      where: { departmentId: departmentId },
    });
    if (department === null)
      return res
        .status(400)
        .send(`department with ${departmentId} id was not found`);

    const { error } = validateVehicle(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: req.body.plateNumber,
        model: req.body.model,
        vehicleStatus: req.body.vehicleStatus,
        modelYear: req.body.modelYear,
        chasisNubmer: req.body.chasisNubmer,
        location: req.body.location,
        purchaseDate: req.body.purchaseDate,
        purchaseMileAge: req.body.purchaseMileAge,
        disposalDate: req.body.disposalDate,
        department: { connect: { departmentId: departmentId } },
      },
      include: {
        department: true,
      },
    });
    return res.json(vehicle);
  } catch (error) {
    res.status(500).send("internal error accrued while saving vehicle");
  }
});

vehicle.put("/dispose/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.update({
      where: { vehicleId: Number(id) },
      data: {
        disposalDate: new Date(req.body.disposalDate),
        reason: req.body.reason,
      },
    });
    return res.json(vehicle);
  } catch (error) {
    res.status(404).send(`vehicle with given ${id} ID was not found`);
  }
});

vehicle.put("/vehicleStatus/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.update({
      where: { vehicleId: Number(id) },
      data: {
        vehicleStatus: req.body.vehicleStatus,
      },
    });
    return res.json(vehicle);
  } catch (error) {
    res.status(404).send(`vehicle with given ${id} ID was not found`);
  }
});

vehicle.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;

    const { error } = validateVehicle(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const vehicle = await prisma.vehicle.update({
      where: { vehicleId: Number(id) },
      data: {
        plateNumber: req.body.plateNumber,
        model: req.body.model,
        modelYear: Number(req.body.modelYear),
        chasisNubmer: Number(req.body.chasisNubmer),
        purchaseDate: req.body.purchaseDate,
        vehicleStatus: req.body.vehicleStatus,
        location: req.body.location,
        purchaseMileAge: Number(req.body.purchaseMileAge),
        disposalDate: req.body.disposalDate,
        department: { connect: { departmentId: Number(departmentId) } },
      },
      include: { department: true },
    });
    return res.json(vehicle);
  } catch (error) {
    res.status(404).send("vehicle with given ID was not found");
  }
});

vehicle.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.delete({
      where: { vehicleId: Number(id) },
    });
    return res.json(vehicle);
  } catch (error) {
    res.status(500).send(`vehicle with the id: ${id}, was not found`);
  }
});

function validateVehicle(req: Request) {
  const schema = Joi.object({
    plateNumber: Joi.string().min(2).max(40).required(),
    model: Joi.string().required(),
    modelYear: Joi.number().required(),
    chasisNubmer: Joi.number().required(),
    purchaseDate: Joi.date().required(),
    purchaseMileAge: Joi.number().required(),
    vehicleStatus: Joi.string().optional(),
    location: Joi.string().required(),
    disposalDate: Joi.date().optional(),
    departmentId: Joi.number().required(),
  });
  return schema.validate(req);
}

export default vehicle;
