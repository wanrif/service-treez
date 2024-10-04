import express, {
	type NextFunction,
	type Request,
	type Response
} from "express";
import cors from "cors";
import router from "./routes";
import pino from "@utils/logHelper";
import errorHandler from "middlewares/errorHandler";
import { notFound } from "@hapi/boom";
import trxHelper from "@utils/trxHelper";

const app = express();
const port = process.env.SERVICE_PORT || 8080;

app.disable("x-powered-by");
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(pino);

app.use((_req: Request, res: Response, next: NextFunction) => {
	const originalJson = res.json;
	res.json = function (body) {
		body.transactionId = trxHelper.generateTrxId();
		return originalJson.call(this, body);
	};
	next();
});

app.get("/", (_req: Request, res: Response) => {
	pino.logger.info("Ping request received");
	res.json({ message: "PING!" });
});

/* Routes setup */
app.use("/api/treez", router);

/* 404 middleware */
app.use((_req: Request, _res: Response, next: NextFunction) => {
	next(notFound("Route not found"));
});

/* Error handling middleware */
app.use(errorHandler);

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
