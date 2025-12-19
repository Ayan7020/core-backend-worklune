import express from "express";
import AuthRouter from "@/routes/auth.routes";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import { RateLimit } from "./lib/middleware/limiters";
import errorHandler from "./lib/middleware/error/errorMiddleware";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(RateLimit);
app.use("/docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec))

app.use("/auth",AuthRouter)

app.use(errorHandler)
export default app;