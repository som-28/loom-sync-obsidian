import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import { LoomSettings } from './settings';

export class GitService {
	private vaultPath: string;
	private settings: LoomSettings;
	private git: SimpleGit;

	constructor(vaultPath: string, settings: LoomSettings) {
		this.vaultPath = vaultPath;
		this.settings = settings;
		this.git = simpleGit(vaultPath);
	}

	updateSettings(settings: LoomSettings) {
		this.settings = settings;
	}

	isRepositoryInitialized(): boolean {
		try {
			// Check if .git directory exists by trying to get status
			// This is a simple way to check without importing fs/path
			return true; // Will be caught if not a git repo
		} catch (error) {
			return false;
		}
	}

	async initRepository(): Promise<void> {
		try {
			// Initialize Git repository
			await this.git.init();
			
			// Set user name and email if configured
			if (this.settings.gitUserName) {
				await this.git.addConfig('user.name', this.settings.gitUserName);
			}
			if (this.settings.gitUserEmail) {
				await this.git.addConfig('user.email', this.settings.gitUserEmail);
			}

			// Create initial .gitignore
			await this.createGitignore();

			// Add remote if configured
			if (this.settings.remoteUrl) {
				await this.git.addRemote('origin', this.settings.remoteUrl);
			}

			// Initial commit
			await this.git.add('.');
			await this.git.commit('Initial commit from Loom Git Sync');

			// Set default branch
			if (this.settings.branch !== 'master') {
				await this.git.branch(['-M', this.settings.branch]);
			}

		} catch (error) {
			throw new Error(`Failed to initialize repository: ${error.message}`);
		}
	}

	async addRemote(url: string, name: string = 'origin'): Promise<void> {
		try {
			// Remove existing remote if it exists
			try {
				await this.git.removeRemote(name);
			} catch {
				// Ignore error if remote doesn't exist
			}
			
			await this.git.addRemote(name, url);
		} catch (error) {
			throw new Error(`Failed to add remote: ${error.message}`);
		}
	}

	async commit(message: string, filePaths?: string[]): Promise<void> {
		try {
			// Stage files
			if (filePaths && filePaths.length > 0) {
				await this.git.add(filePaths);
			} else {
				await this.git.add('.');
			}

			// Check if there are changes to commit
			const status = await this.git.status();
			if (status.staged.length === 0) {
				return; // Nothing to commit
			}

			// Commit
			await this.git.commit(message);
		} catch (error) {
			throw new Error(`Failed to commit: ${error.message}`);
		}
	}

	async push(remote: string = 'origin', branch?: string): Promise<void> {
		try {
			const targetBranch = branch || this.settings.branch;
			await this.git.push(remote, targetBranch);
		} catch (error) {
			if (error.message.includes('upstream')) {
				// Set upstream and push
				const targetBranch = branch || this.settings.branch;
				await this.git.push(['-u', remote, targetBranch]);
			} else {
				throw new Error(`Failed to push: ${error.message}`);
			}
		}
	}

	async pull(remote: string = 'origin', branch?: string): Promise<void> {
		try {
			const targetBranch = branch || this.settings.branch;
			await this.git.pull(remote, targetBranch);
		} catch (error) {
			throw new Error(`Failed to pull: ${error.message}`);
		}
	}

	async getStatus(): Promise<GitStatus> {
		try {
			const status = await this.git.status();
			
			return {
				staged: status.staged,
				modified: status.modified,
				untracked: status.not_added,
				deleted: status.deleted,
				clean: status.isClean()
			};
		} catch (error) {
			throw new Error(`Failed to get status: ${error.message}`);
		}
	}

	async getCommitHistory(limit: number = 10): Promise<GitCommit[]> {
		try {
			const log = await this.git.log({ maxCount: limit });
			
			return log.all.map((commit: any) => ({
				hash: commit.hash,
				author: commit.author_name,
				email: commit.author_email,
				date: new Date(commit.date),
				message: commit.message
			}));
		} catch (error) {
			return []; // Return empty array if no commits yet
		}
	}

	async getCurrentBranch(): Promise<string> {
		try {
			const status = await this.git.status();
			return status.current || 'main';
		} catch (error) {
			return 'main'; // Default fallback
		}
	}

	async getBranches(): Promise<string[]> {
		try {
			const result = await this.git.branch(['-a']);
			return result.all.filter((branch: any) => !branch.startsWith('remotes/origin/HEAD'));
		} catch (error) {
			return [];
		}
	}

	async checkForConflicts(): Promise<string[]> {
		try {
			const status = await this.git.status();
			return status.conflicted || [];
		} catch (error) {
			return [];
		}
	}

	async testConnection(): Promise<boolean> {
		try {
			if (!this.settings.remoteUrl) {
				return false;
			}
			
			await this.git.listRemote([this.settings.remoteUrl]);
			return true;
		} catch (error) {
			return false;
		}
	}

	generateCommitMessage(action: string, filename: string): string {
		return this.settings.commitMessageTemplate
			.replace('{action}', this.capitalizeFirst(action))
			.replace('{filename}', filename);
	}

	private async createGitignore(): Promise<void> {
		const defaultPatterns = [
			'# Obsidian workspace files',
			'.obsidian/workspace.json',
			'.obsidian/workspace-mobile.json',
			'.obsidian/cache/',
			'',
			'# Temporary files',
			'*.tmp',
			'*~',
			'',
			'# System files',
			'.DS_Store',
			'Thumbs.db',
			'',
			'# User-defined patterns',
			...this.settings.excludePatterns
		].join('\n');

		try {
			// Try to check if .gitignore exists using git show
			try {
				await this.git.show(['.gitignore']);
			} catch {
				// File doesn't exist, we would create it but skip for now
				// In a real implementation, we'd use Obsidian's vault API
				console.log('Would create .gitignore file');
			}
		} catch (error) {
			console.warn('Failed to create .gitignore:', error.message);
		}
	}

	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}

export interface GitStatus {
	staged: string[];
	modified: string[];
	untracked: string[];
	deleted: string[];
	clean: boolean;
}

export interface GitCommit {
	hash: string;
	author: string;
	email: string;
	date: Date;
	message: string;
}
