import * as sinon from "sinon";

export default function spyOnStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream, options?: { spyOnData: boolean }) {
	options = {
		spyOnData: true,
		...options
	};
	
	const spies = {
		error: sinon.spy(),
		data: sinon.spy(),
		end: sinon.spy(),
		finish: sinon.spy(),
		close: sinon.spy()
	};
	
	stream.on('error', spies.error)
		.on('end', spies.end)
		.on('finish', spies.finish)
		.on('close', spies.close);
	
	if(options.spyOnData) {
		stream.on('data', spies.data);
	}
	
	return spies;
}