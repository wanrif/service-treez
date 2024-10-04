import moment from "moment";
import { customAlphabet } from "nanoid";

const trxHelper = {
	generateTrxId: () => {
		const appId = "TR3Z";
		const timestamp = moment().format("YYMMDDHHmmssSSS");
		return `${appId}${timestamp}${customAlphabet("1234567890abcdefzyxwvu", 8)().toUpperCase()}`;
	}
};

export default trxHelper;
