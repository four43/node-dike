import * as stream from "stream";
import {Deferred} from "ts-deferred";

/**
 * Transform
 *
 * A drop in replacement for stream.Transform
 *
 * * continueOnError option that allow the stream to keep flowing through a pipe after an error is emitted.
 * * Promisified has promise methods so you can directly attach to a stream and handle done states in a chain.
 */
export default class Transform<T, U> extends stream.Transform implements Promise<undefined> {
	
	[Symbol.toStringTag]: 'Promise';
	private source: NodeJS.ReadableStream;
	
	private result: Deferred<undefined>;
	private errored: false | Error = false;
	private finished: boolean = false;
	
	constructor(public options?: ITransformOptions<T, U>) {
		super({
			...options,
			transform: async (chunk, encoding, callback) => {
				try {
					const transformResult = options.transform(chunk as any as T, encoding, (err, result) => {
						(err) ? callback(err) : callback(null, result);
					});
					if (transformResult instanceof Promise) {
						transformResult
							.then((result) =>
								callback(null, result)
							)
							.catch((err) =>
								callback(err)
							);
					}
				}
				catch (err) {
					callback(err);
				}
			}
		});
		
		// Set these up right away in case our .then, .catch is after our stream is already done.
		this.on('error', (err) => {
			this.errored = err;
		});
		
		this.on('finish', () => {
			this.finished = true;
		});
		
		// Re-pipe error handling
		if (options.continueOnError) {
			this.on('pipe', (source: NodeJS.ReadableStream) => {
				// Something was piped to us
				this.source = source;
			});
			
			this.on('error', () => {
				if (this.source) {
					this.source.pipe(this);
				}
			});
		}
	}
	
	
	then(onfulfilled?: ((value: undefined) => undefined | Promise<undefined>) | undefined | null,
	     onrejected?: ((reason: any) => U | PromiseLike<U>) | undefined | null): Promise<undefined> {
		
		this.setupPromise();
		
		return this.result.promise.then(onfulfilled, onrejected);
	}
	
	catch(onrejected?: ((reason: any) => undefined | Promise<undefined>) | undefined | null): Promise<undefined> {
		
		this.setupPromise();
		
		return this.result.promise.catch(onrejected);
	}
	
	private setupPromise() {
		if (!this.result) {
			this.result = new Deferred<undefined>();
			
			// Promise handlers
			if (this.finished && (!this.errored || this.options.continueOnError)) {
				this.result.resolve();
			}
			else {
				this.on('finish', this.result.resolve);
			}
			
			if (this.errored) {
				if (!this.options.continueOnError) {
					this.result.reject(this.errored);
				}
			}
			else {
				if (!this.options.continueOnError) {
					this.on('error', this.result.reject);
				}
			}
		}
	}
}

export interface ITransformOptions<T, U> extends stream.TransformOptions {
	continueOnError?: boolean,
	transform: (chunk: T | string | Buffer, encoding: string, callback?: (error: Error | null, result?: U) => void) => Promise<U> | void;
}