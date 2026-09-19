import JSZip = require("..");

const file = new JSZip().file("hello.txt", "Hello").file("hello.txt")!;

const textStream: JSZip.JSZipStreamHelper<string> = file.internalStream("string");
const text: Promise<string> = textStream.accumulate();
const bytes: Promise<Uint8Array> = file.internalStream("uint8array").accumulate();
const buffer: Promise<Buffer> = file.internalStream("nodebuffer").accumulate();
const arrayBuffer: Promise<ArrayBuffer> = file.internalStream("arraybuffer").accumulate();

textStream.on("data", (chunk, metadata) => {
    const data: string = chunk;
    const percent: number = metadata.percent;
}).pause().resume();

// @ts-expect-error The result type is determined by the output type.
const invalidResult: Promise<number> = file.internalStream("string").accumulate();

// @ts-expect-error Only supported output types are accepted.
file.internalStream("unsupported");
