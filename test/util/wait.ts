export default function wait<T>(waitTime:number = 50):Promise<T> {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), waitTime);
	})
}