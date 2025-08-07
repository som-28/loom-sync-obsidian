export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: any = null;
	
	return (...args: Parameters<T>) => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}
		
		timeoutId = setTimeout(() => {
			func.apply(null, args);
		}, delay);
	};
}

export function throttle<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let lastExecution = 0;
	
	return (...args: Parameters<T>) => {
		const now = Date.now();
		if (now - lastExecution >= delay) {
			lastExecution = now;
			func.apply(null, args);
		}
	};
}

export function sanitizeFilename(filename: string): string {
	// Remove or replace characters that might cause issues in commit messages
	return filename.replace(/[<>:"|?*]/g, '_');
}

export function formatFileSize(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	if (bytes === 0) return '0 Bytes';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(date: Date): string {
	return date.toLocaleString();
}

export function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return 'just now';
	} else if (diffMinutes < 60) {
		return `${diffMinutes} minutes ago`;
	} else if (diffHours < 24) {
		return `${diffHours} hours ago`;
	} else if (diffDays < 30) {
		return `${diffDays} days ago`;
	} else {
		return date.toLocaleDateString();
	}
}

export function isValidGitUrl(url: string): boolean {
	const gitUrlPatterns = [
		/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/,
		/^git@github\.com:[\w.-]+\/[\w.-]+\.git$/,
		/^https:\/\/gitlab\.com\/[\w.-]+\/[\w.-]+\.git$/,
		/^git@gitlab\.com:[\w.-]+\/[\w.-]+\.git$/,
		/^https:\/\/bitbucket\.org\/[\w.-]+\/[\w.-]+\.git$/,
		/^git@bitbucket\.org:[\w.-]+\/[\w.-]+\.git$/,
		// Generic patterns
		/^https:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+\.git$/,
		/^git@[\w.-]+:[\w.-]+\/[\w.-]+\.git$/
	];

	return gitUrlPatterns.some(pattern => pattern.test(url));
}

export function extractRepoName(url: string): string {
	try {
		const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
		return match ? match[1] : 'repository';
	} catch {
		return 'repository';
	}
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class RetryHelper {
	static async retry<T>(
		operation: () => Promise<T>,
		maxRetries: number = 3,
		baseDelay: number = 1000
	): Promise<T> {
		let lastError: Error;
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;
				
				if (attempt === maxRetries) {
					break;
				}
				
				// Exponential backoff
				const delay = baseDelay * Math.pow(2, attempt);
				await sleep(delay);
			}
		}
		
		throw lastError!;
	}
}
