import { Plugin } from 'obsidian';
import { SyncStatus } from './sync-manager';

export class StatusBarManager {
	private plugin: any; // Will be LoomPlugin but avoiding circular import
	private statusBarItem: HTMLElement | null = null;
	private currentStatus: SyncStatus = 'idle';
	private currentMessage: string = '';

	constructor(plugin: any) {
		this.plugin = plugin;
	}

	initialize() {
		// Create status bar item
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.statusBarItem.addClass('loom-status-bar');
		
		// Make it clickable to open sync panel
		this.statusBarItem.addEventListener('click', () => {
			this.plugin.syncPanel.show();
		});

		// Set initial status
		this.updateStatus('idle', 'Ready');

		// Register with sync manager for status updates
		if (this.plugin.syncManager) {
			this.plugin.syncManager.onStatusChange((status: SyncStatus, message?: string) => {
				this.updateStatus(status, message);
			});
		}
	}

	updateStatus(status: SyncStatus, message?: string) {
		if (!this.statusBarItem) {
			return;
		}

		this.currentStatus = status;
		this.currentMessage = message || '';

		// Update icon and text based on status
		const { icon, text, title } = this.getStatusDisplay(status, message);
		
		// Clear and update content
		this.statusBarItem.innerHTML = '';
		this.statusBarItem.innerHTML = `${icon} ${text}`;
		this.statusBarItem.setAttribute('title', title);
		
		// Update CSS class for styling
		this.statusBarItem.className = this.statusBarItem.className
			.replace(/status-(idle|syncing|error|offline)/g, '');
		this.statusBarItem.className += ` status-${status}`;
	}

	updateAutoSyncStatus(enabled: boolean) {
		if (enabled && this.currentStatus === 'idle') {
			this.updateStatus('idle', 'Auto-sync enabled');
		} else if (!enabled) {
			this.updateStatus('offline', 'Auto-sync disabled');
		}
	}

	private getStatusDisplay(status: SyncStatus, message?: string): { icon: string, text: string, title: string } {
		switch (status) {
			case 'idle':
				return {
					icon: '✅',
					text: 'Synced',
					title: `Loom Git Sync: ${message || 'Everything is up to date'}`
				};
			
			case 'syncing':
				return {
					icon: '🔄',
					text: 'Syncing...',
					title: `Loom Git Sync: ${message || 'Synchronizing changes'}`
				};
			
			case 'error':
				return {
					icon: '❌',
					text: 'Error',
					title: `Loom Git Sync: ${message || 'Sync error occurred'}`
				};
			
			case 'offline':
				return {
					icon: '📡',
					text: 'Offline',
					title: `Loom Git Sync: ${message || 'No remote configured or connection failed'}`
				};
			
			default:
				return {
					icon: '❓',
					text: 'Unknown',
					title: 'Loom Git Sync: Unknown status'
				};
		}
	}

	cleanup() {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}
}
