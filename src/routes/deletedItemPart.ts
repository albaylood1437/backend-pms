import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";

const prisma = new PrismaClient();

const deletedItemPart: Router = Router();

deletedItemPart.get("/", async (req: Request, res: Response) => {
  try {
    const deletedItemPart = await prisma.deletedItemPart.findMany({
      include: { supplier: true, garage: true },
    });
    res.send(deletedItemPart);
  } catch (error) {
    res.status(404).send("can,t find any deletedItemPart");
  }
});

deletedItemPart.post("/", async (req: Request, res: Response) => {
  const { supplierId } = req.body;
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { supplierId: Number(supplierId) },
    });

    if (supplier === null)
      return res
        .status(400)
        .send(`supplier with ${supplierId} id was not found`);

    const { error } = validatedeletedItemPart(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const deletedItemPart = await prisma.deletedItemPart.create({
      data: {
        itemPart: req.body.itemPart,
        partName: req.body.partName,
        partQuantity: Number(req.body.partQuantity),
        partPrice: Number(req.body.partPrice),
        id: Number(req.body.id),
        supplier: { connect: { supplierId: Number(supplierId) } },
      },
      include: {
        garage: true,
        supplier: true,
      },
    });

    return res.json(deletedItemPart);
  } catch (error) {
    res.status(500).send("internal error accrued while saving itemPart");
  }
});

function validatedeletedItemPart(req: Request) {
  const schema = Joi.object({
    itemPart: Joi.string().required(),
    partName: Joi.string().min(2).max(40).required(),
    partQuantity: Joi.number().required(),
    partPrice: Joi.number().required(),
    id: Joi.number().required(),
    supplierId: Joi.number().required(),
  });
  return schema.validate(req);
}

export default deletedItemPart;
