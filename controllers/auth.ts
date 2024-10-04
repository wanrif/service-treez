import { badRequest, Boom, boomify, isBoom } from "@hapi/boom";
import pino from "@utils/logHelper";
import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { PrismaClient } from "@prisma/client";
import trxHelper from "@utils/trxHelper";

const router = Router();
const LOG = "LOG_AUTH";
const prisma = new PrismaClient();

const login = async (req: Request, res: Response) => {
	try {
		const validation = z
			.object({
				email: z.string().email(),
				password: z.string().min(8)
			})
			.strict()
			.safeParse(req.body);

		if (!validation.success) {
			const error = fromError(validation.error);
			throw badRequest(error.message);
		}

		const { email, password } = validation.data;

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			throw badRequest("Invalid Credentials!");
		}

		const isValid = await Bun.password.verify(
			password,
			user.password,
			"argon2id"
		);
		if (!isValid) {
			throw badRequest("Invalid Credentials!");
		}

		const trxId = trxHelper.generateTrxId();

		pino.logger.info(`Login attempt for ${trxId} successful`);

		res.json({ message: "Login successful" });
	} catch (err: any) {
		pino.logger.error({ msg: err.message, handler: `${LOG} LOGIN_HANDLER` });

		if (isBoom(err)) {
			res.status(err.output.statusCode).send(err.output.payload);
		} else {
			const error: Boom = boomify(err);
			res.status(error.output.statusCode).send(error.output.payload);
		}
	}
};

const register = async (req: Request, res: Response) => {
	try {
		const validation = z
			.object({
				email: z.string().email(),
				name: z.string().min(3),
				password: z.string().min(8)
			})
			.strict()
			.safeParse(req.body);

		if (!validation.success) {
			const error = fromError(validation.error);
			throw badRequest(error.message);
		}

		const { email, name, password } = validation.data;

		const userExists = await prisma.user.findUnique({ where: { email } });
		if (userExists) {
			throw badRequest("User already exists!");
		}

		const hashedPassword = await Bun.password.hash(password, {
			algorithm: "argon2id",
			memoryCost: 4,
			timeCost: 3
		});

		await prisma.user.create({
			data: {
				email,
				name,
				password: hashedPassword
			}
		});

		pino.logger.info(`Register attempt for ${email}`);

		res.json({ message: "Registration successful" });
	} catch (err: any) {
		pino.logger.error({ msg: err.message, handler: `${LOG} REGISTER_HANDLER` });

		if (isBoom(err)) {
			res.status(err.output.statusCode).send(err.output.payload);
		} else {
			const error: Boom = boomify(err);
			res.status(error.output.statusCode).send(error.output.payload);
		}
	}
};

router.post("/login", login);
router.post("/register", register);

export default router;
