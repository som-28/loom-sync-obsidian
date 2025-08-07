// Simplified main.js for testing Loom Git Sync Plugin
// This version focuses on basic functionality without complex TypeScript types

const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

class LoomPlugin extends Plugin {
	constructor() {
		super(...arguments);
		this.settings = {
			remoteUrl: '',
			branch: 'main',
			authMethod: 'https',
			autoSync: true,
			commitMessageTemplate: '{action}: {filename}',
			debounceDelay: 500,
			excludePatterns: [
				'.obsidian/workspace.json',
				'.obsidian/workspace-mobile.json',
				'.obsidian/cache',
				'*.tmp',
				'*~'
			],
			gitUserName: '',
			gitUserEmail: '',
			autoPush: false,
			showNotifications: true
		};
	}

	async onload() {
		console.log('🚀 Loom Git Sync: Loading plugin...');
		
		// Load settings
		await this.loadSettings();
		
		// Add settings tab
		this.addSettingTab(new LoomSettingsTab(this.app, this));
		
		// Create status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar('idle', 'Ready');
		
		// Add commands
		this.setupCommands();
		
		// Initialize file watching if enabled
		if (this.settings.autoSync) {
			this.startFileWatching();
		}
		
		console.log('✅ Loom Git Sync: Plugin loaded successfully!');
		
		if (this.settings.showNotifications) {
			new Notice('Loom Git Sync plugin loaded');
		}
	}

	async onunload() {
		console.log('👋 Loom Git Sync: Plugin unloaded');
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, this.settings, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		console.log('💾 Loom Git Sync: Settings saved');
	}

	setupCommands() {
		// Test command
		this.addCommand({
			id: 'loom-test',
			name: 'Test Loom Git Sync',
			callback: () => {
				new Notice('🎉 Loom Git Sync is working!');
				console.log('✅ Loom test command executed');
				this.updateStatusBar('idle', 'Test successful');
			}
		});

		// Initialize Git repository
		this.addCommand({
			id: 'loom-init-repo',
			name: 'Initialize Git Repository',
			callback: async () => {
				try {
					await this.initGitRepo();
					new Notice('✅ Git repository initialized');
					this.updateStatusBar('idle', 'Repository initialized');
				} catch (error) {
					new Notice('❌ Failed to initialize Git: ' + error.message);
					this.updateStatusBar('error', 'Init failed');
					console.error('Git init error:', error);
				}
			}
		});

		// Manual sync
		this.addCommand({
			id: 'loom-manual-sync',
			name: 'Manual Sync',
			callback: async () => {
				this.updateStatusBar('syncing', 'Manual sync...');
				try {
					await this.performSync();
					new Notice('✅ Manual sync completed');
					this.updateStatusBar('idle', 'Sync completed');
				} catch (error) {
					new Notice('❌ Sync failed: ' + error.message);
					this.updateStatusBar('error', 'Sync failed');
					console.error('Sync error:', error);
				}
			}
		});

		// Toggle auto-sync
		this.addCommand({
			id: 'loom-toggle-auto-sync',
			name: 'Toggle Auto-sync',
			callback: async () => {
				this.settings.autoSync = !this.settings.autoSync;
				await this.saveSettings();
				
				const status = this.settings.autoSync ? 'enabled' : 'disabled';
				new Notice(`🔄 Auto-sync ${status}`);
				this.updateStatusBar('idle', `Auto-sync ${status}`);
				
				if (this.settings.autoSync) {
					this.startFileWatching();
				} else {
					this.stopFileWatching();
				}
			}
		});

		// Open settings
		this.addCommand({
			id: 'loom-open-settings',
			name: 'Open Settings',
			callback: () => {
				this.app.setting.open();
				this.app.setting.openTabById('loom-git-sync');
			}
		});
	}

	updateStatusBar(status, message) {
		if (!this.statusBarItem) return;
		
		const statusIcons = {
			idle: '✅',
			syncing: '🔄',
			error: '❌',
			offline: '📡'
		};
		
		const icon = statusIcons[status] || '❓';
		this.statusBarItem.setText(`${icon} Loom: ${message || status}`);
		this.statusBarItem.title = `Loom Git Sync: ${message || status}`;
		
		// Add click handler to open settings
		this.statusBarItem.onClickEvent(() => {
			this.app.setting.open();
			this.app.setting.openTabById('loom-git-sync');
		});
	}

	startFileWatching() {
		if (this.fileWatcherActive) return;
		
		console.log('👁️ Loom Git Sync: Starting file watcher...');
		this.fileWatcherActive = true;
		
		// Register vault events
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				this.handleFileChange(file, 'create');
			})
		);
		
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				this.handleFileChange(file, 'modify');
			})
		);
		
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				this.handleFileChange(file, 'delete');
			})
		);
		
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				this.handleFileChange(file, 'rename', oldPath);
			})
		);
		
		if (this.settings.showNotifications) {
			new Notice('👁️ File watching started');
		}
	}

	stopFileWatching() {
		this.fileWatcherActive = false;
		console.log('🛑 Loom Git Sync: File watcher stopped');
		
		if (this.settings.showNotifications) {
			new Notice('🛑 File watching stopped');
		}
	}

	handleFileChange(file, action, oldPath = null) {
		if (!this.fileWatcherActive || !this.shouldSyncFile(file)) {
			return;
		}
		
		console.log(`📝 File ${action}:`, file.path);
		
		// Debounce the sync operation
		if (this.syncTimeout) {
			clearTimeout(this.syncTimeout);
		}
		
		this.syncTimeout = setTimeout(async () => {
			try {
				await this.syncFileChange(file, action, oldPath);
			} catch (error) {
				console.error('File sync error:', error);
				this.updateStatusBar('error', 'Sync error');
			}
		}, this.settings.debounceDelay);
	}

	shouldSyncFile(file) {
		if (!file || !file.path) return false;
		
		// Check exclusion patterns
		for (const pattern of this.settings.excludePatterns) {
			if (this.matchesPattern(file.path, pattern)) {
				return false;
			}
		}
		
		return true;
	}

	matchesPattern(filePath, pattern) {
		// Simple glob pattern matching
		const regex = new RegExp(
			pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.')
		);
		return regex.test(filePath);
	}

	async syncFileChange(file, action, oldPath) {
		this.updateStatusBar('syncing', `Syncing ${action}...`);
		
		// Generate commit message
		const message = this.generateCommitMessage(action, file.name, oldPath);
		console.log(`🔄 Syncing: ${message}`);
		
		try {
			// Perform the actual sync operation
			await this.performSync();
		} catch (error) {
			console.error('File sync error:', error);
			this.updateStatusBar('error', 'Sync failed');
			if (this.settings.showNotifications) {
				new Notice(`❌ Sync failed: ${file.name}`);
			}
			throw error;
		}
	}

	generateCommitMessage(action, filename, oldPath = null) {
		let actionText = action;
		if (action === 'rename' && oldPath) {
			actionText = `Renamed: ${oldPath} → ${filename}`;
		} else {
			actionText = action.charAt(0).toUpperCase() + action.slice(1);
		}
		
		return this.settings.commitMessageTemplate
			.replace('{action}', actionText)
			.replace('{filename}', filename);
	}

	async initGitRepo() {
		try {
			console.log('🔧 Initializing Git repository...');
			
			const vaultPath = this.app.vault.adapter.basePath;
			const { exec } = require('child_process');
			const { promisify } = require('util');
			const execAsync = promisify(exec);
			
			// Check if already a git repo
			try {
				await execAsync('git rev-parse --git-dir', { cwd: vaultPath });
				console.log('✅ Git repository already exists');
				return;
			} catch {
				// Not a git repo, initialize it
			}
			
			// Initialize git repository
			await execAsync('git init', { cwd: vaultPath });
			console.log('✅ Git repository initialized');
			
			// Create .gitignore if it doesn't exist
			const fs = require('fs');
			const path = require('path');
			const gitignorePath = path.join(vaultPath, '.gitignore');
			
			if (!fs.existsSync(gitignorePath)) {
				const gitignoreContent = `# Obsidian
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/hotkeys.json
.obsidian/appearance.json
.obsidian/core-plugins.json
.obsidian/community-plugins.json

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;
				fs.writeFileSync(gitignorePath, gitignoreContent);
				console.log('✅ Created .gitignore file');
			}
			
		} catch (error) {
			console.error('Git initialization error:', error);
			throw error;
		}
	}

	async performSync() {
		try {
			console.log('🔄 Performing sync...');
			this.updateStatusBar('syncing', 'Syncing...');
			
			const vaultPath = this.app.vault.adapter.basePath;
			const { exec } = require('child_process');
			const { promisify } = require('util');
			const execAsync = promisify(exec);
			
			// Add all files
			await execAsync('git add .', { cwd: vaultPath });
			
			// Check if there are changes to commit
			try {
				const { stdout } = await execAsync('git diff --staged --quiet', { cwd: vaultPath });
			} catch (error) {
				// There are changes to commit
				const commitMessage = `Auto-sync: ${new Date().toLocaleString()}`;
				await execAsync(`git commit -m "${commitMessage}"`, { cwd: vaultPath });
				console.log('✅ Changes committed');
				
				// Push to remote if configured
				if (this.settings.remoteUrl) {
					try {
						await execAsync('git push origin main', { cwd: vaultPath });
						console.log('✅ Changes pushed to remote');
						this.updateStatusBar('synced', 'Synced');
						
						if (this.settings.showNotifications) {
							new Notice('🚀 Changes synced to GitHub!');
						}
					} catch (pushError) {
						console.error('Push error:', pushError);
						// Try to set up remote and push
						if (pushError.message.includes('No such remote')) {
							await execAsync(`git remote add origin ${this.settings.remoteUrl}`, { cwd: vaultPath });
							await execAsync('git branch -M main', { cwd: vaultPath });
							await execAsync('git push -u origin main', { cwd: vaultPath });
							console.log('✅ Remote configured and changes pushed');
							this.updateStatusBar('synced', 'Synced');
						} else {
							this.updateStatusBar('error', 'Push failed');
							if (this.settings.showNotifications) {
								new Notice('❌ Failed to push to GitHub');
							}
						}
					}
				} else {
					console.log('⚠️ No remote URL configured');
					this.updateStatusBar('warning', 'No remote');
					if (this.settings.showNotifications) {
						new Notice('⚠️ No GitHub repository configured');
					}
				}
			}
			
		} catch (error) {
			console.error('Sync error:', error);
			this.updateStatusBar('error', 'Sync error');
			if (this.settings.showNotifications) {
				new Notice('❌ Sync failed: ' + error.message);
			}
		}
	}
}

class LoomSettingsTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
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
						this.plugin.startFileWatching();
					} else {
						this.plugin.stopFileWatching();
					}
				}));

		new Setting(containerEl)
			.setName('Commit message template')
			.setDesc('Template for commit messages. Use {action} and {filename}')
			.addText(text => text
				.setPlaceholder('{action}: {filename}')
				.setValue(this.plugin.settings.commitMessageTemplate)
				.onChange(async (value) => {
					this.plugin.settings.commitMessageTemplate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce delay (ms)')
			.setDesc('Delay before syncing after file changes')
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
			.setName('Auto-push')
			.setDesc('Automatically push commits to remote')
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

		// Test section
		containerEl.createEl('h3', { text: 'Testing' });
		
		new Setting(containerEl)
			.setName('Test Plugin')
			.setDesc('Test basic plugin functionality')
			.addButton(button => button
				.setButtonText('Run Test')
				.setCta()
				.onClick(() => {
					new Notice('🧪 Running plugin test...');
					console.log('🧪 Loom Git Sync test executed from settings');
					setTimeout(() => {
						new Notice('✅ Plugin test completed!');
					}, 1000);
				}));
	}
}

module.exports = LoomPlugin;
