import {Deferred} from "ts-deferred";

/**
 * Wrap an existing readable stream in our extra features.
 * @param stream
 * @returns {{then: (()), catch: (())}}
 */
function enhance<T extends NodeJS.ReadableStream | NodeJS.WritableStream>(stream: T, options?: IEnhanceOptions):T & Promise<void> {
	
	if(stream && (<any>stream)._transform) {
		console.warn("If you're looking to enhance a transform stream, use `dike.Transform` - this will give you more consistent functionality");
	}
	
	options = {
		...options
	};
	
	let result: Deferred<void>;
	let errored: false | Error = false;
	let done: boolean = false;
	
	let pipeSource: NodeJS.ReadableStream;
	let pipeDests: NodeJS.WritableStream[] = [];
	
	let doneEvent: string;
	if (isWritable(stream)) {
		doneEvent = 'end';
	}
	else {
		doneEvent = 'finish';
	}
	
	function setupPromise():Promise<void> {
		if (!result) {
			result = new Deferred<void>();
			
			// Promise handlers
			if (done && (!errored || options.continueOnError)) {
				result.resolve();
			}
			else {
				/*
				 * End is more important in a transform stream that's both. Data is written to the
				 * writable side, transformed, then output to the readable side. The stream is done when
				 * the data has fully been written out.
				 */
				stream.on(doneEvent, result.resolve);
			}
			
			if (errored) {
				if (!options.continueOnError) {
					result.reject(errored);
				}
			}
			else {
				if (!options.continueOnError) {
					stream.on('error', result.reject);
				}
			}
		}
		return result.promise;
	}
	
	// Set these up right away in case our .then, .catch is after our stream is already done.
	stream.on('error', (err: Error) => {
		// Re-pipe error handling
		if (options.continueOnError && isReadable(stream)) {
			pipeDests.forEach(pipeDst => stream.pipe(pipeDst));
		}
		
		if(options.continueOnError && isWritable(stream)) {
			// Who was piped to us?
			if (pipeSource) {
				pipeSource.pipe(stream);
			}
		}
		
		if(!options.continueOnError) {
			// Reset destinations, errors disconnect pipes
			pipeDests = [];
		}
		errored = err;
	});
	
	stream.on('pipe', (source: NodeJS.ReadableStream) => {
		// Something was piped to us
		pipeSource = source;
		console.log(this);
	});
	stream.on('unpipe', (source: NodeJS.ReadableStream) => {
		// Something was piped to us
		if(!options.continueOnError) {
			pipeSource = undefined;
		}
	});
	
	stream.on(doneEvent, () => {
		done = true;
	});
	
	
	const enhancedStream = stream as any as T & Promise<void>;
	setupPromises(enhancedStream, setupPromise);
	
	if (isReadable(stream)) {
		// Re-pipe if things go south
		const enhancedStream:IStreamPromiseReadable = stream as any as IStreamPromiseReadable;
		
		const streamPipe = stream.pipe;
		enhancedStream.pipe = function <U extends NodeJS.WritableStream>(destination: U, options?: { end?: boolean; }): U {
			pipeDests.push(destination);
			streamPipe.call(enhancedStream, destination, options);
			return destination;
		};
		
		const streamUnpipe = stream.unpipe;
		enhancedStream.unpipe = function <U extends NodeJS.WritableStream>(destination?: U) {
			pipeDests = pipeDests.filter(savedDst => savedDst !== destination);
			streamUnpipe(destination);
			return this;
		};
	}
	return enhancedStream;
}

function isReadable(obj: any): obj is NodeJS.ReadableStream {
	return obj != null
		&& obj.on
		&& obj.read && obj.setEncoding
		&& obj.resume && obj.pause && obj.pipe
		&& obj.unpipe && obj.unshift && obj.wrap;
}

function isWritable(obj: any): obj is NodeJS.WritableStream {
	return obj != null
		&& obj.on
		&& obj.write
		&& obj.end;
}

function setupPromises<T>(stream: any, setupPromise: () => Promise<void>) {
	
	stream.then = function (onfulfilled?: ((value: undefined) => undefined | Promise<void>) | undefined | null,
	                                onrejected?: ((reason: Error) => any | PromiseLike<any>) | undefined | null): Promise<void> {
		return setupPromise()
			.then(onfulfilled, onrejected);
	};
	
	stream.catch = function (onrejected?: ((reason: any) => undefined | Promise<void>) | undefined | null): Promise<void> {
		return setupPromise()
			.catch(onrejected);
	};
	
	return stream;
}
export interface IEnhanceOptions {
	continueOnError?: boolean
}

export interface IExtends {

}

export interface IStreamPromiseReadable extends NodeJS.ReadableStream, Promise<void> {
	// @todo - Do we need to support pipe's end option?
	fork(...receivingStreams: NodeJS.WritableStream[]): this;
}

export interface IStreamPromiseWritable extends NodeJS.WritableStream, Promise<void> {

}

export interface IStreamPromiseDuplex extends IStreamPromiseReadable, IStreamPromiseWritable {

}

export default enhance;