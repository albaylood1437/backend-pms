import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const department: Router = Router();

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};
const getPagingData = (
  departmentName: any,
  page: number,
  limit: number,
  totalItems: number
) => {
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, departmentName, totalPages, currentPage };
};

department.get("/", async (req: Request, res: Response) => {
  try {
    const { page = 0, size = 7 }: any = req.query;
    const { limit, offset }: any = getPagination(page, size);
    const department = await prisma.department.findMany({
      take: Number(limit),
      skip: Number(offset),
    });
    const totalItems = await prisma.department.count();
    const data = getPagingData(department as any, page, limit, totalItems);
    res.send(data);
  } catch (error) {
    res.status(404).send("can,t find any department");
  }
});

department.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.findMany({
      where: { departmentId: Number(id) },
    });

    return res.json(department);
  } catch (error) {
    res.status(404).send("can,t find any department");
  }
});

department.post("/", async (req: Request, res: Response) => {
  const { error } = validateDepartment(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const department = await prisma.department.create({
      data: { departmentName: req.body.departmentName },
    });
    return res.json(department);
  } catch (error) {
    res.status(500).send("internal error accrued while saving department");
  }
});

department.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = validateDepartment(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const department = await prisma.department.update({
      where: { departmentId: Number(id) },
      data: { departmentName: req.body.departmentName },
    });
    return res.json(department);
  } catch (error) {
    res.status(404).send("department with given ID was not found");
  }
});

department.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.delete({
      where: { departmentId: Number(id) },
    });
    return res.json(department);
  } catch (error) {
    res.status(500).send(`department with the id: ${id}, was not found`);
  }
});

function validateDepartment(req: Request) {
  const schema = Joi.object({
    departmentName: Joi.string().min(2).max(40).required(),
  });
  return schema.validate(req);
}

export default department;
