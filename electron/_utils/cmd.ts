import { spawnSync } from 'child_process';

export const runCMD = (command: string, args: string[]) => {
	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true
	});
	if (result.error) {
		return Promise.reject(result.error);
	} else {
		if (result.status === 0) {
			return Promise.resolve(null);
		}
		return Promise.reject(new Error(`Exit code ${result.status}`));
	}
};
