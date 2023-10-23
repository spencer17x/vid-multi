import { spawnSync } from 'child_process';

export const runCMD = (command: string, args: string[]) => {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true
	});
	if (result.error) {
		const error =
			result.error instanceof Error
				? result.error
				: new Error(`Unknown error: ${result.error}`);
		return Promise.reject(error);
	} else {
		if (result.status === 0) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				new TypeError(`命令执行失败，退出码为:${result.status}`)
			);
		}
	}
};
