import express from "express";
import AuthRouter from "@/routes/auth.routes";
import DashBoardRoutes from "@/routes/dashboard.routes";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import { RateLimit } from "./lib/middleware/limiters";
import errorHandler from "./lib/middleware/error/errorMiddleware";
import cookieParser from "cookie-parser";
import { isAuthenticatedUserMiddleware } from "./lib/middleware/auth/isAuth.middleware";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(RateLimit);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", AuthRouter);
app.use("/dash", isAuthenticatedUserMiddleware, DashBoardRoutes);

app.use(errorHandler);
export default app;
