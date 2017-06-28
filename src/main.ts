import enhance from "./Stream/enhance";
import Transform from "./Stream/Transform";

interface IEnhancedWritableStream extends NodeJS.WritableStream, Promise<undefined> {
}
interface IEnhancedReadableStream extends NodeJS.ReadableStream, Promise<undefined> {
}
interface IEnhancedTransformStream extends NodeJS.ReadableStream, NodeJS.WritableStream, Promise<undefined> {
}

export {
	enhance,
	Transform,
	
	IEnhancedWritableStream,
	IEnhancedReadableStream,
	IEnhancedTransformStream
};