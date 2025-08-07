import { Plugin, PluginSettingTab, Setting, Notice, WorkspaceLeaf } from 'obsidian';
import { GitService } from './src/git-service';
import { FileWatcher } from './src/file-watcher';
import { SyncManager } from './src/sync-manager';
import { LoomSettings, DEFAULT_SETTINGS } from './src/settings';
import { StatusBarManager } from './src/status-bar';
import { SyncPanel, SYNC_PANEL_VIEW_TYPE } from './src/sync-panel';

export default class LoomPlugin extends Plugin {
	settings: LoomSettings;
	gitService: GitService;
	fileWatcher: FileWatcher;
	syncManager: SyncManager;
	statusBarManager: StatusBarManager;

	async onload() {
		console.log('Loading Loom Git Sync plugin');
		
		await this.loadSettings();
		
		// Add settings tab
		this.addSettingTab(new LoomSettingsTab(this.app, this));

		// Initialize core services with fallback for vault path
		const vaultPath = this.getVaultPath();
		this.gitService = new GitService(vaultPath, this.settings);
		this.fileWatcher = new FileWatcher(this.app, this.settings);
		this.syncManager = new SyncManager(this.gitService, this.fileWatcher, this.settings);
		this.statusBarManager = new StatusBarManager(this);

		// Register the sync panel view
		this.registerView(
			SYNC_PANEL_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new SyncPanel(leaf, this)
		);

		// Initialize sync manager
		try {
			await this.syncManager.initialize();
		} catch (error) {
			console.error('Failed to initialize sync manager:', error);
		}

		// Setup UI components
		this.setupCommands();
		this.setupStatusBar();

		// Start file watching if auto-sync is enabled
		if (this.settings.autoSync) {
			await this.startFileWatching();
		}

		console.log('Loom Git Sync plugin loaded successfully');
	}

	async onunload() {
		if (this.fileWatcher) {
			this.fileWatcher.stop();
		}
		console.log('Loom Git Sync plugin unloaded');
	}

	private getVaultPath(): string {
		// Try to get the vault path, with fallbacks
		const adapter = this.app.vault.adapter;
		if (adapter && 'path' in adapter) {
			return adapter.path as string;
		}
		// Fallback for different adapter types
		return this.app.vault.configDir || '.';
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// Update services with new settings
		if (this.gitService) {
			this.gitService.updateSettings(this.settings);
		}
		if (this.fileWatcher) {
			this.fileWatcher.updateSettings(this.settings);
		}
		if (this.syncManager) {
			this.syncManager.updateSettings(this.settings);
		}
	}

	private setupCommands() {
		// Initialize Git repository
		this.addCommand({
			id: 'init-git-repo',
			name: 'Initialize Git repository',
			callback: async () => {
				try {
					await this.gitService.initRepository();
					new Notice('Git repository initialized successfully');
					this.statusBarManager.updateStatus('idle', 'Repository initialized');
				} catch (error) {
					new Notice(`Failed to initialize repository: ${error.message}`);
					this.statusBarManager.updateStatus('error', error.message);
				}
			}
		});

		// Manual sync
		this.addCommand({
			id: 'manual-sync',
			name: 'Manual sync now',
			callback: async () => {
				await this.syncManager.performManualSync();
			}
		});

		// Push to remote
		this.addCommand({
			id: 'push-to-remote',
			name: 'Push to remote',
			callback: async () => {
				try {
					this.statusBarManager.updateStatus('syncing', 'Pushing to remote...');
					await this.gitService.push();
					new Notice('Successfully pushed to remote');
					this.statusBarManager.updateStatus('idle', 'Pushed to remote');
				} catch (error) {
					new Notice(`Failed to push: ${error.message}`);
					this.statusBarManager.updateStatus('error', error.message);
				}
			}
		});

		// Pull from remote
		this.addCommand({
			id: 'pull-from-remote',
			name: 'Pull from remote',
			callback: async () => {
				try {
					this.statusBarManager.updateStatus('syncing', 'Pulling from remote...');
					await this.gitService.pull();
					new Notice('Successfully pulled from remote');
					this.statusBarManager.updateStatus('idle', 'Pulled from remote');
				} catch (error) {
					new Notice(`Failed to pull: ${error.message}`);
					this.statusBarManager.updateStatus('error', error.message);
				}
			}
		});

		// View sync history
		this.addCommand({
			id: 'view-sync-history',
			name: 'View sync history',
			callback: async () => {
				await this.activateSyncPanel();
			}
		});

		// Open settings
		this.addCommand({
			id: 'open-settings',
			name: 'Open settings',
			callback: () => {
				this.app.setting.open();
				this.app.setting.openTabById('loom-git-sync');
			}
		});

		// Toggle auto-sync
		this.addCommand({
			id: 'toggle-auto-sync',
			name: 'Toggle auto-sync',
			callback: async () => {
				this.settings.autoSync = !this.settings.autoSync;
				await this.saveSettings();
				
				if (this.settings.autoSync) {
					await this.startFileWatching();
					new Notice('Auto-sync enabled');
				} else {
					this.fileWatcher.stop();
					new Notice('Auto-sync disabled');
				}
				
				this.statusBarManager.updateAutoSyncStatus(this.settings.autoSync);
			}
		});
	}

	private setupStatusBar() {
		this.statusBarManager.initialize();
	}

	private async activateSyncPanel() {
		const existing = this.app.workspace.getLeavesOfType(SYNC_PANEL_VIEW_TYPE);
		
		if (existing.length) {
			this.app.workspace.revealLeaf(existing[0]);
		} else {
			const leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: SYNC_PANEL_VIEW_TYPE,
				active: true
			});
			this.app.workspace.revealLeaf(leaf);
		}
	}

	private async startFileWatching() {
		if (!this.gitService.isRepositoryInitialized()) {
			new Notice('Please initialize Git repository first');
			return;
		}

		this.fileWatcher.start((file, action) => {
			this.syncManager.handleFileChange(file, action);
		});
	}
}

class LoomSettingsTab extends PluginSettingTab {
	plugin: LoomPlugin;

	constructor(app: any, plugin: LoomPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Loom Git Sync Settings' });

		// Repository Settings
		containerEl.createEl('h3', { text: 'Repository Settings' });

		new Setting(containerEl)
			.setName('Remote URL')
			.setDesc('Git remote repository URL (HTTPS or SSH)')
			.addText(text => text
				.setPlaceholder('https://github.com/username/repo.git')
				.setValue(this.plugin.settings.remoteUrl)
				.onChange(async (value) => {
					this.plugin.settings.remoteUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Branch')
			.setDesc('Git branch to sync with')
			.addText(text => text
				.setPlaceholder('main')
				.setValue(this.plugin.settings.branch)
				.onChange(async (value) => {
					this.plugin.settings.branch = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Authentication Method')
			.setDesc('Choose authentication method for remote repository')
			.addDropdown(dropdown => dropdown
				.addOption('ssh', 'SSH')
				.addOption('https', 'HTTPS')
				.setValue(this.plugin.settings.authMethod)
				.onChange(async (value) => {
					this.plugin.settings.authMethod = value as 'ssh' | 'https';
					await this.plugin.saveSettings();
				}));

		// Sync Options
		containerEl.createEl('h3', { text: 'Sync Options' });

		new Setting(containerEl)
			.setName('Auto-sync')
			.setDesc('Automatically sync changes with Git')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSync)
				.onChange(async (value) => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();
					
					if (value) {
						await this.plugin.startFileWatching();
					} else {
						this.plugin.fileWatcher.stop();
					}
				}));

		new Setting(containerEl)
			.setName('Commit message template')
			.setDesc('Template for auto-generated commit messages. Use {action}, {filename}')
			.addText(text => text
				.setPlaceholder('{action}: {filename}')
				.setValue(this.plugin.settings.commitMessageTemplate)
				.onChange(async (value) => {
					this.plugin.settings.commitMessageTemplate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce delay (ms)')
			.setDesc('Delay before syncing after file changes to avoid excessive commits')
			.addSlider(slider => slider
				.setLimits(100, 5000, 100)
				.setValue(this.plugin.settings.debounceDelay)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.debounceDelay = value;
					await this.plugin.saveSettings();
				}));

		// Advanced Options
		containerEl.createEl('h3', { text: 'Advanced Options' });

		new Setting(containerEl)
			.setName('Git user name')
			.setDesc('Name to use for Git commits')
			.addText(text => text
				.setPlaceholder('Your Name')
				.setValue(this.plugin.settings.gitUserName)
				.onChange(async (value) => {
					this.plugin.settings.gitUserName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Git user email')
			.setDesc('Email to use for Git commits')
			.addText(text => text
				.setPlaceholder('your.email@example.com')
				.setValue(this.plugin.settings.gitUserEmail)
				.onChange(async (value) => {
					this.plugin.settings.gitUserEmail = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-push')
			.setDesc('Automatically push commits to remote repository')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoPush)
				.onChange(async (value) => {
					this.plugin.settings.autoPush = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Show toast notifications for sync operations')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		// Test connection button
		new Setting(containerEl)
			.setName('Test connection')
			.setDesc('Test connection to remote repository')
			.addButton(button => button
				.setButtonText('Test')
				.setCta()
				.onClick(async () => {
					try {
						button.setButtonText('Testing...');
						button.setDisabled(true);
						
						const result = await this.plugin.gitService.testConnection();
						if (result) {
							new Notice('Connection successful!');
						} else {
							new Notice('Connection failed. Please check your settings.');
						}
					} catch (error) {
						new Notice(`Connection failed: ${error.message}`);
					} finally {
						button.setButtonText('Test');
						button.setDisabled(false);
					}
				}));
	}
}
