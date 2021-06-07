import config from "config";
import cors from "cors";
import express from "express";
import users from "./routes/users";
import auth from "./routes/auth";
import garage from "./routes/garage";
import supplier from "./routes/supplier";
import department from "./routes/department";
import vehicle from "./routes/vehicle";
import part from "./routes/part";
import driver from "./routes/driver";
import serviceExpense from "./routes/serviceExpense";
import itemPart from "./routes/itemPart";
import deletedItemPart from "./routes/deletedItemPart";
import deletedServiceExpense from "./routes/deletedExpenses";
import driving from "./routes/driving";
const app = express();

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtPrivateKey not defined");
  process.exit(1);
}
// middleware
app.use(express.json());
app.use(cors());
app.use("/users", users);
app.use("/garage", garage);
app.use("/supplier", supplier);
app.use("/department", department);
app.use("/part", part);
app.use("/service", serviceExpense);
app.use("/deletedService", deletedServiceExpense);
app.use("/driver", driver);
app.use("/vehicle", vehicle);
app.use("/itemPart", itemPart);
app.use("/driving", driving);
app.use("/deletedItemPart", deletedItemPart);

app.use("/auth", auth);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server is running on ${port}`));
