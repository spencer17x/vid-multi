import { spawnSync } from 'child_process';

export const runCMD = (command: string, args: string[]) => {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true
	});
	if (result.error) {
		if (result.error instanceof Error) {
			return Promise.reject(result.error);
		}
		return Promise.reject(new Error(JSON.stringify(result)));
	} else {
		if (result.status === 0) {
			return Promise.resolve(null);
		}
		return Promise.reject(new Error(`Exit code ${result.status}`));
	}
};
