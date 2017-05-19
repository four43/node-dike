import * as stream from "stream";

export default class Transform extends stream.Transform {
	
	source: NodeJS.ReadableStream;
	
	constructor(opts?: ITransformOptions) {
		super(opts);
		this.on('pipe', (source: NodeJS.ReadableStream) => {
			this.source = source;
		});
		if(opts.continueOnError) {
			this.on('error', () => this.rePipe());
		}
	}
	
	rePipe() {
		this.source.pipe(this);
		return this;
	}
}

export interface ITransformOptions extends stream.TransformOptions {
	continueOnError?: boolean
}