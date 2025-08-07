import { TFile, Notice } from 'obsidian';
import { GitService } from './git-service';
import { FileWatcher, FileChangeAction } from './file-watcher';
import { LoomSettings } from './settings';
import { RetryHelper, sanitizeFilename } from './utils';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export class SyncManager {
	private gitService: GitService;
	private fileWatcher: FileWatcher;
	private settings: LoomSettings;
	private status: SyncStatus = 'idle';
	private lastSyncTime: Date | null = null;
	private syncQueue: SyncOperation[] = [];
	private isProcessingQueue = false;
	private statusCallbacks: ((status: SyncStatus, message?: string) => void)[] = [];

	constructor(gitService: GitService, fileWatcher: FileWatcher, settings: LoomSettings) {
		this.gitService = gitService;
		this.fileWatcher = fileWatcher;
		this.settings = settings;
	}

	updateSettings(settings: LoomSettings) {
		this.settings = settings;
	}

	async initialize(): Promise<void> {
		try {
			// Check if repository is initialized
			if (!this.gitService.isRepositoryInitialized()) {
				this.updateStatus('offline', 'Git repository not initialized');
				return;
			}

			// Test connection if remote is configured
			if (this.settings.remoteUrl) {
				const connectionOk = await this.gitService.testConnection();
				if (!connectionOk) {
					this.updateStatus('offline', 'Cannot connect to remote repository');
					return;
				}
			}

			this.updateStatus('idle', 'Ready to sync');
			this.lastSyncTime = new Date();
		} catch (error) {
			this.updateStatus('error', `Initialization failed: ${error.message}`);
		}
	}

	onStatusChange(callback: (status: SyncStatus, message?: string) => void) {
		this.statusCallbacks.push(callback);
	}

	removeStatusCallback(callback: (status: SyncStatus, message?: string) => void) {
		const index = this.statusCallbacks.indexOf(callback);
		if (index > -1) {
			this.statusCallbacks.splice(index, 1);
		}
	}

	async handleFileChange(file: TFile, action: FileChangeAction): Promise<void> {
		if (this.status === 'error' || this.status === 'offline') {
			return;
		}

		// Add to sync queue
		const operation: SyncOperation = {
			file,
			action,
			timestamp: new Date(),
			retries: 0
		};

		this.syncQueue.push(operation);
		await this.processQueue();
	}

	async performManualSync(): Promise<void> {
		if (this.status === 'syncing') {
			if (this.settings.showNotifications) {
				new Notice('Sync already in progress');
			}
			return;
		}

		try {
			this.updateStatus('syncing', 'Manual sync started');

			// Get current status
			const status = await this.gitService.getStatus();
			
			if (status.clean) {
				if (this.settings.showNotifications) {
					new Notice('No changes to sync');
				}
				this.updateStatus('idle', 'No changes to sync');
				return;
			}

			// Commit all changes
			await this.gitService.commit('Manual sync from Loom');

			// Push if auto-push is enabled and remote is configured
			if (this.settings.autoPush && this.settings.remoteUrl) {
				await this.gitService.push();
			}

			this.lastSyncTime = new Date();
			
			if (this.settings.showNotifications) {
				new Notice('Manual sync completed');
			}
			
			this.updateStatus('idle', 'Manual sync completed');

		} catch (error) {
			const errorMessage = `Manual sync failed: ${error.message}`;
			this.updateStatus('error', errorMessage);
			
			if (this.settings.showNotifications) {
				new Notice(errorMessage);
			}
		}
	}

	async pullFromRemote(): Promise<void> {
		if (!this.settings.remoteUrl) {
			throw new Error('No remote repository configured');
		}

		try {
			this.updateStatus('syncing', 'Pulling from remote');
			await this.gitService.pull();
			
			this.lastSyncTime = new Date();
			this.updateStatus('idle', 'Pull completed');
			
			if (this.settings.showNotifications) {
				new Notice('Successfully pulled from remote');
			}
		} catch (error) {
			this.updateStatus('error', `Pull failed: ${error.message}`);
			throw error;
		}
	}

	async pushToRemote(): Promise<void> {
		if (!this.settings.remoteUrl) {
			throw new Error('No remote repository configured');
		}

		try {
			this.updateStatus('syncing', 'Pushing to remote');
			await this.gitService.push();
			
			this.lastSyncTime = new Date();
			this.updateStatus('idle', 'Push completed');
			
			if (this.settings.showNotifications) {
				new Notice('Successfully pushed to remote');
			}
		} catch (error) {
			this.updateStatus('error', `Push failed: ${error.message}`);
			throw error;
		}
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.syncQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;
		this.updateStatus('syncing', 'Processing file changes');

		try {
			// Process operations in batches
			while (this.syncQueue.length > 0) {
				const operation = this.syncQueue.shift()!;
				await this.processSyncOperation(operation);
			}

			// Push if auto-push is enabled and remote is configured
			if (this.settings.autoPush && this.settings.remoteUrl) {
				try {
					await this.gitService.push();
				} catch (error) {
					console.warn('Auto-push failed:', error.message);
					// Don't fail the entire sync operation if push fails
				}
			}

			this.lastSyncTime = new Date();
			this.updateStatus('idle', 'Sync completed');

		} catch (error) {
			this.updateStatus('error', `Sync failed: ${error.message}`);
			
			if (this.settings.showNotifications) {
				new Notice(`Sync failed: ${error.message}`);
			}
		} finally {
			this.isProcessingQueue = false;
		}
	}

	private async processSyncOperation(operation: SyncOperation): Promise<void> {
		try {
			await RetryHelper.retry(async () => {
				const commitMessage = this.generateCommitMessage(operation);
				
				// For delete operations, we don't need to check if file exists
				if (operation.action === 'delete') {
					await this.gitService.commit(commitMessage);
				} else {
					// For other operations, commit the specific file
					await this.gitService.commit(commitMessage, [operation.file.path]);
				}
			}, 2, 1000);

		} catch (error) {
			operation.retries++;
			
			if (operation.retries < 3) {
				// Re-add to queue for retry
				this.syncQueue.unshift(operation);
			} else {
				console.error(`Failed to sync ${operation.file.path} after 3 retries:`, error.message);
			}
			
			throw error;
		}
	}

	private generateCommitMessage(operation: SyncOperation): string {
		const filename = sanitizeFilename(operation.file.name);
		const action = this.getActionDisplayName(operation.action);
		
		return this.gitService.generateCommitMessage(action, filename);
	}

	private getActionDisplayName(action: FileChangeAction): string {
		switch (action) {
			case 'create':
				return 'Created';
			case 'modify':
				return 'Updated';
			case 'delete':
				return 'Deleted';
			case 'rename':
				return 'Renamed';
			default:
				return 'Modified';
		}
	}

	private updateStatus(status: SyncStatus, message?: string) {
		this.status = status;
		this.statusCallbacks.forEach(callback => {
			callback(status, message);
		});
	}

	// Getters
	getStatus(): SyncStatus {
		return this.status;
	}

	getLastSyncTime(): Date | null {
		return this.lastSyncTime;
	}

	getQueueLength(): number {
		return this.syncQueue.length;
	}

	isOnline(): boolean {
		return this.status !== 'offline' && this.status !== 'error';
	}
}

interface SyncOperation {
	file: TFile;
	action: FileChangeAction;
	timestamp: Date;
	retries: number;
}
