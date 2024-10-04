import PinoHttp from "pino-http";

const pino = PinoHttp({
	base: null,
	transport: {
		target: "pino-pretty"
	},
	formatters: {
		level: (label) => ({ level: label })
	}
});

export default pino;
