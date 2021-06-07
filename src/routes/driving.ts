import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const driving: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  drivingDescription: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, drivingDescription, totalPages, currentPage };
};

driving.get("/InActive", async (req: Request, res: Response) => {
  try {
    const driving = await prisma.driving.findMany({
      where: { NOT: { drivingStatus: "Active" } },
      include: { vehicle: true, drivers: true },
    });
    const totalItems = driving.length;
    res.send(driving);
  } catch (error) {
    res.status(404).send("can,t find any driving");
  }
});

driving.get("/active", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const driving = await prisma.driving.findMany({
      take: Number(limit),
      skip: Number(offset),
      where: { drivingStatus: "Active" },
      include: { vehicle: true, drivers: true },
    });
    const totalItems = driving.length;
    const data = getPagingData(driving as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any driving");
  }
});

driving.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const driving = await prisma.driving.findMany({
      take: Number(limit),
      skip: Number(offset),
      include: { vehicle: true, drivers: true },
    });
    const totalItems = await prisma.driving.count();
    const data = getPagingData(driving as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any driving");
  }
});

driving.post("/", async (req: Request, res: Response) => {
  const { vehicleId, driverId } = req.body;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicleId: vehicleId },
    });

    if (vehicle === null)
      res.status(400).send(`vehicle with ${vehicleId} id was not found`);

    const driver = await prisma.drivers.findUnique({
      where: { driverId: driverId },
    });

    if (driver === null)
      res.status(400).send(`Driver with given ID ${driverId} was not found`);

    const { error } = validateDriving(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const driving = await prisma.driving.create({
      data: {
        drivingDescription: req.body.drivingDescription,
        drivingDate: new Date(req.body.drivingDate),
        vehicle: { connect: { vehicleId: Number(vehicleId) } },
        drivers: { connect: { driverId: Number(driverId) } },
      },
      include: { vehicle: true, drivers: true },
    });
    await prisma.vehicle.update({
      where: { vehicleId: Number(vehicleId) },
      data: { vehicleStatus: "Yes" },
    });
    await prisma.drivers.update({
      where: { driverId: Number(driverId) },
      data: { driverStatus: "Yes" },
    });
    return res.json(driving);
  } catch (error) {
    res.status(500).send("internal error accrued while saving driving");
  }
});

driving.put("/changeVehicle/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { vehicleId } = req.body;
  try {
    const driving = await prisma.driving.update({
      where: { drivingId: Number(id) },
      data: {
        reason: req.body.reason,
        vehicle: { connect: { vehicleId: vehicleId } },
      },
      include: { vehicle: true, drivers: true },
    });
    await prisma.vehicle.update({
      where: { vehicleId: Number(vehicleId) },
      data: { vehicleStatus: "Yes" },
    });
    return res.json(driving);
  } catch (error) {
    res.status(404).send("driving with given ID was not found");
  }
});

driving.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { vehicleId, driverId } = req.body;
  const { error } = validateDriving(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const driving = await prisma.driving.update({
      where: { drivingId: Number(id) },
      data: {
        drivingDescription: req.body.drivingDescription,
        drivingDate: new Date(req.body.drivingDate),
        reason: req.body.reason,
        drivingStatus: req.body.drivingStatus,
        vehicle: { connect: { vehicleId: vehicleId } },
        drivers: { connect: { driverId: driverId } },
      },
      include: { vehicle: true, drivers: true },
    });
    await prisma.vehicle.update({
      where: { vehicleId: Number(vehicleId) },
      data: { vehicleStatus: "Yes" },
    });
    await prisma.drivers.update({
      where: { driverId: Number(driverId) },
      data: { driverStatus: "Yes" },
    });
    return res.json(driving);
  } catch (error) {
    res.status(404).send("driving with given ID was not found");
  }
});

driving.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const driving = await prisma.driving.delete({
      where: { drivingId: Number(id) },
    });
    if (driving.drivingStatus !== "InActive") {
      const { vehicleId, driverId } = driving;
      await prisma.vehicle.update({
        where: { vehicleId: Number(vehicleId) },
        data: { vehicleStatus: "No" },
      });
      await prisma.drivers.update({
        where: { driverId: Number(driverId) },
        data: { driverStatus: "No" },
      });
    }
    return res.json(driving);
  } catch (error) {
    res.status(500).send(`driving with the id: ${id}, was not found`);
  }
});

function validateDriving(req: Request) {
  const schema = Joi.object({
    drivingDate: Joi.date().required(),
    drivingDescription: Joi.string().optional(),
    vehicleId: Joi.number().required(),
    driverId: Joi.number().required(),
    reason: Joi.string().optional(),
    drivingStatus: Joi.string().optional(),
  });
  return schema.validate(req);
}

export default driving;
