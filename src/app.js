import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// rotes import
import userRouter from "./routes/user.routes.js";

// Route declaration
app.use("/api/v1/users", userRouter); //-> standard practice, mentioning version of api ans now all user routes like login and register will not make it clumsy

export { app };
