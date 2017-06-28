import enhance from "./Stream/enhance";
import Transform from "./Stream/Transform";

interface IEnhancedWritableSteam extends NodeJS.WritableStream, Promise<undefined> {
}
interface IEnhancedReadableSteam extends NodeJS.ReadableStream, Promise<undefined> {
}
interface IEnhancedTransformSteam extends NodeJS.ReadableStream, NodeJS.WritableStream, Promise<undefined> {
}

export {
	enhance,
	Transform,
	
	IEnhancedWritableSteam,
	IEnhancedReadableSteam,
	IEnhancedTransformSteam
};