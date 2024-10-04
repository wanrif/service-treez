import { type Request, type Response, type NextFunction } from "express";
import { isBoom, Boom } from "@hapi/boom";
import pino from "@utils/logHelper";

interface CustomError extends Error {
	status?: number;
}

function errorHandler(
	err: CustomError | Boom,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	pino.logger.error({ msg: err.message, handler: "ERROR_HANDLER" });

	// Check if the error is a Boom error
	if (isBoom(err)) {
		const { output } = err;
		return res.status(output.statusCode).json(output.payload);
	}

	// Handle non-Boom errors
	const statusCode = err.status || 500;
	const message = err.message || "Internal Server Error";

	res.status(statusCode).json({
		error: {
			message,
			status: statusCode
		}
	});
}

export default errorHandler;
