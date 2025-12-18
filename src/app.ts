import express from "express";
import AuthRouter from "@/routes/auth.routes";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import { RateLimit } from "./lib/middleware/limiters";

const app = express();

app.use(RateLimit);
app.use("/docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec))

app.use("/auth",AuthRouter)

export default app;