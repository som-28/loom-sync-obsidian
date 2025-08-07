import { App, WorkspaceLeaf, ItemView, ButtonComponent, Setting } from 'obsidian';
import { GitCommit } from './git-service';
import { formatTimeAgo, formatDate } from './utils';

export const SYNC_PANEL_VIEW_TYPE = 'loom-sync-panel';

export class SyncPanel extends ItemView {
	private app: App;
	private plugin: any; // LoomPlugin
	private refreshInterval: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: any) {
		super(leaf);
		this.plugin = plugin;
		this.app = plugin.app;
	}

	getViewType(): string {
		return SYNC_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Loom Git Sync';
	}

	getIcon(): string {
		return 'git-branch';
	}

	async onOpen(): Promise<void> {
		await this.refresh();
		
		// Auto-refresh every 30 seconds
		this.refreshInterval = window.setInterval(() => {
			this.refresh();
		}, 30000);
	}

	async onClose(): Promise<void> {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}

	async refresh(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();

		// Header
		container.createEl('h2', { text: 'Loom Git Sync' });

		// Repository Status Section
		await this.renderRepositoryStatus(container);

		// Action Buttons Section
		this.renderActionButtons(container);

		// Recent Commits Section
		await this.renderRecentCommits(container);

		// Sync Statistics Section
		this.renderSyncStatistics(container);
	}

	private async renderRepositoryStatus(container: HTMLElement): Promise<void> {
		const statusSection = container.createDiv({ cls: 'loom-status-section' });
		statusSection.createEl('h3', { text: 'Repository Status' });

		try {
			const gitService = this.plugin.gitService;
			const syncManager = this.plugin.syncManager;

			// Repository info
			const repoInfo = statusSection.createDiv({ cls: 'repo-info' });
			
			if (gitService.isRepositoryInitialized()) {
				const currentBranch = await gitService.getCurrentBranch();
				const status = await gitService.getStatus();
				
				repoInfo.createEl('div', { 
					text: `Branch: ${currentBranch}`,
					cls: 'repo-detail'
				});

				repoInfo.createEl('div', { 
					text: `Remote: ${this.plugin.settings.remoteUrl || 'Not configured'}`,
					cls: 'repo-detail'
				});

				// Status details
				const statusDiv = repoInfo.createDiv({ cls: 'status-details' });
				
				if (status.clean) {
					statusDiv.createEl('div', { 
						text: '✅ Working directory clean',
						cls: 'status-clean'
					});
				} else {
					if (status.modified.length > 0) {
						statusDiv.createEl('div', { 
							text: `📝 ${status.modified.length} modified files`,
							cls: 'status-modified'
						});
					}
					if (status.untracked.length > 0) {
						statusDiv.createEl('div', { 
							text: `➕ ${status.untracked.length} untracked files`,
							cls: 'status-untracked'
						});
					}
					if (status.deleted.length > 0) {
						statusDiv.createEl('div', { 
							text: `🗑️ ${status.deleted.length} deleted files`,
							cls: 'status-deleted'
						});
					}
				}

				// Sync status
				const syncStatus = syncManager.getStatus();
				const lastSync = syncManager.getLastSyncTime();
				
				statusDiv.createEl('div', { 
					text: `Sync Status: ${this.getSyncStatusText(syncStatus)}`,
					cls: `sync-status sync-${syncStatus}`
				});

				if (lastSync) {
					statusDiv.createEl('div', { 
						text: `Last Sync: ${formatTimeAgo(lastSync)}`,
						cls: 'last-sync'
					});
				}

			} else {
				repoInfo.createEl('div', { 
					text: '⚠️ Git repository not initialized',
					cls: 'repo-not-initialized'
				});
			}

		} catch (error) {
			statusSection.createEl('div', { 
				text: `❌ Error loading repository status: ${error.message}`,
				cls: 'error-message'
			});
		}
	}

	private renderActionButtons(container: HTMLElement): void {
		const buttonsSection = container.createDiv({ cls: 'loom-buttons-section' });
		buttonsSection.createEl('h3', { text: 'Actions' });

		const buttonContainer = buttonsSection.createDiv({ cls: 'button-container' });

		// Initialize Repository button
		if (!this.plugin.gitService.isRepositoryInitialized()) {
			new ButtonComponent(buttonContainer)
				.setButtonText('Initialize Repository')
				.setCta()
				.onClick(async () => {
					try {
						await this.plugin.gitService.initRepository();
						await this.refresh();
					} catch (error) {
						console.error('Failed to initialize repository:', error);
					}
				});
		}

		// Manual Sync button
		new ButtonComponent(buttonContainer)
			.setButtonText('Manual Sync')
			.onClick(async () => {
				await this.plugin.syncManager.performManualSync();
				await this.refresh();
			});

		// Pull button
		if (this.plugin.settings.remoteUrl) {
			new ButtonComponent(buttonContainer)
				.setButtonText('Pull from Remote')
				.onClick(async () => {
					try {
						await this.plugin.syncManager.pullFromRemote();
						await this.refresh();
					} catch (error) {
						console.error('Failed to pull:', error);
					}
				});

			// Push button
			new ButtonComponent(buttonContainer)
				.setButtonText('Push to Remote')
				.onClick(async () => {
					try {
						await this.plugin.syncManager.pushToRemote();
						await this.refresh();
					} catch (error) {
						console.error('Failed to push:', error);
					}
				});
		}

		// Settings button
		new ButtonComponent(buttonContainer)
			.setButtonText('Open Settings')
			.onClick(() => {
				this.app.setting.open();
				this.app.setting.openTabById('loom-git-sync');
			});
	}

	private async renderRecentCommits(container: HTMLElement): Promise<void> {
		const commitsSection = container.createDiv({ cls: 'loom-commits-section' });
		commitsSection.createEl('h3', { text: 'Recent Commits' });

		try {
			const commits = await this.plugin.gitService.getCommitHistory(10);
			
			if (commits.length === 0) {
				commitsSection.createEl('div', { 
					text: 'No commits yet',
					cls: 'no-commits'
				});
				return;
			}

			const commitsList = commitsSection.createDiv({ cls: 'commits-list' });
			
			commits.forEach(commit => {
				const commitEl = commitsList.createDiv({ cls: 'commit-item' });
				
				const commitHeader = commitEl.createDiv({ cls: 'commit-header' });
				commitHeader.createEl('span', { 
					text: commit.message,
					cls: 'commit-message'
				});
				commitHeader.createEl('span', { 
					text: formatTimeAgo(commit.date),
					cls: 'commit-time'
				});

				const commitDetails = commitEl.createDiv({ cls: 'commit-details' });
				commitDetails.createEl('span', { 
					text: commit.hash.substring(0, 7),
					cls: 'commit-hash'
				});
				commitDetails.createEl('span', { 
					text: commit.author,
					cls: 'commit-author'
				});
			});

		} catch (error) {
			commitsSection.createEl('div', { 
				text: `Error loading commits: ${error.message}`,
				cls: 'error-message'
			});
		}
	}

	private renderSyncStatistics(container: HTMLElement): void {
		const statsSection = container.createDiv({ cls: 'loom-stats-section' });
		statsSection.createEl('h3', { text: 'Statistics' });

		const statsContainer = statsSection.createDiv({ cls: 'stats-container' });

		// Queue length
		const queueLength = this.plugin.syncManager.getQueueLength();
		statsContainer.createEl('div', { 
			text: `Queue Length: ${queueLength}`,
			cls: 'stat-item'
		});

		// Auto-sync status
		const autoSyncEnabled = this.plugin.settings.autoSync;
		statsContainer.createEl('div', { 
			text: `Auto-sync: ${autoSyncEnabled ? 'Enabled' : 'Disabled'}`,
			cls: 'stat-item'
		});

		// Last sync time
		const lastSync = this.plugin.syncManager.getLastSyncTime();
		if (lastSync) {
			statsContainer.createEl('div', { 
				text: `Last Sync: ${formatDate(lastSync)}`,
				cls: 'stat-item'
			});
		}

		// Connection status
		const isOnline = this.plugin.syncManager.isOnline();
		statsContainer.createEl('div', { 
			text: `Status: ${isOnline ? 'Online' : 'Offline'}`,
			cls: `stat-item ${isOnline ? 'status-online' : 'status-offline'}`
		});
	}

	private getSyncStatusText(status: string): string {
		switch (status) {
			case 'idle':
				return '✅ Ready';
			case 'syncing':
				return '🔄 Syncing';
			case 'error':
				return '❌ Error';
			case 'offline':
				return '📡 Offline';
			default:
				return '❓ Unknown';
		}
	}

	show(): void {
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(SYNC_PANEL_VIEW_TYPE)[0]
		);
	}

	cleanup(): void {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}
}
