
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import moviesRoutes from "./modules/movies/movies.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
 
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Movie App backend is running!",
  });
});
 app.use("/api/v1/movies", moviesRoutes);
// Keep these two middleware handlers last.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
