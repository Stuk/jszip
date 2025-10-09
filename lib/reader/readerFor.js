import { getTypeOf, checkSupport, transformTo } from "../utils.js";
import support from "../support.js";
import { ArrayReader } from "./ArrayReader.js";
import { StringReader } from "./StringReader.js";
import { Uint8ArrayReader } from "./Uint8ArrayReader.js";

/**
 * Create a reader adapted to the data.
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
 * @return {DataReader} the data reader.
 */
export default function (data) {
    var type = getTypeOf(data);
    checkSupport(type);
    if (type === "string" && !support.uint8array) {
        return new StringReader(data);
    }
    if (support.uint8array) {
        return new Uint8ArrayReader(transformTo("uint8array", data));
    }
    return new ArrayReader(transformTo("array", data));
};
