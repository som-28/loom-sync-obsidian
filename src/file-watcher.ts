import { App, TFile, TFolder, Vault } from 'obsidian';
import { LoomSettings } from './settings';
import { debounce } from './utils';

export type FileChangeAction = 'create' | 'modify' | 'delete' | 'rename';

export class FileWatcher {
	private app: App;
	private settings: LoomSettings;
	private isActive: boolean = false;
	private callback: ((file: TFile, action: FileChangeAction) => void) | null = null;
	private eventRefs: any[] = [];

	constructor(app: App, settings: LoomSettings) {
		this.app = app;
		this.settings = settings;
	}

	updateSettings(settings: LoomSettings) {
		this.settings = settings;
	}

	start(callback: (file: TFile, action: FileChangeAction) => void) {
		if (this.isActive) {
			this.stop();
		}

		this.isActive = true;
		this.callback = callback;
		this.setupFileEvents();
		console.log('File watcher started');
	}

	stop() {
		if (!this.isActive) {
			return;
		}

		this.isActive = false;
		this.callback = null;
		
		// Unregister all events
		this.eventRefs.forEach(ref => {
			this.app.vault.offref(ref);
		});
		this.eventRefs = [];
		
		console.log('File watcher stopped');
	}

	private handleFileChange = debounce((file: TFile, action: FileChangeAction) => {
		if (!this.isActive || !this.callback || this.shouldIgnoreFile(file)) {
			return;
		}
		this.callback(file, action);
	}, 500); // Use a fixed debounce for now

	private setupFileEvents() {
		// File created
		const createRef = this.app.vault.on('create', (file) => {
			if (file instanceof TFile) {
				this.handleFileChange(file, 'create');
			}
		});
		this.eventRefs.push(createRef);

		// File modified
		const modifyRef = this.app.vault.on('modify', (file) => {
			if (file instanceof TFile) {
				this.handleFileChange(file, 'modify');
			}
		});
		this.eventRefs.push(modifyRef);

		// File deleted
		const deleteRef = this.app.vault.on('delete', (file) => {
			if (file instanceof TFile) {
				this.handleFileChange(file, 'delete');
			}
		});
		this.eventRefs.push(deleteRef);

		// File renamed
		const renameRef = this.app.vault.on('rename', (file, oldPath) => {
			if (file instanceof TFile) {
				// For rename, we'll treat it as a modify operation
				this.handleFileChange(file, 'rename');
			}
		});
		this.eventRefs.push(renameRef);
	}

	private shouldIgnoreFile(file: TFile): boolean {
		const filePath = file.path;
		
		// Check against exclude patterns
		for (const pattern of this.settings.excludePatterns) {
			if (this.matchesPattern(filePath, pattern)) {
				return true;
			}
		}

		// Ignore files in .git directory
		if (filePath.startsWith('.git/')) {
			return true;
		}

		// Ignore temporary files and system files
		const tempPatterns = [
			/\.tmp$/,
			/~$/,
			/\.DS_Store$/,
			/^Thumbs\.db$/,
			/\.swp$/,
			/\.swo$/
		];

		for (const pattern of tempPatterns) {
			if (pattern.test(filePath)) {
				return true;
			}
		}

		return false;
	}

	private matchesPattern(filePath: string, pattern: string): boolean {
		// Simple glob pattern matching
		// Convert glob pattern to regex
		const regexPattern = pattern
			.replace(/\./g, '\\.')
			.replace(/\*/g, '.*')
			.replace(/\?/g, '.');

		const regex = new RegExp(`^${regexPattern}$`);
		return regex.test(filePath);
	}

	getWatchedFileTypes(): string[] {
		return [
			'md',
			'canvas',
			'excalidraw',
			'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
			'pdf', 'txt', 'json', 'css', 'js', 'ts'
		];
	}

	isWatchingFile(file: TFile): boolean {
		if (this.shouldIgnoreFile(file)) {
			return false;
		}

		const extension = file.extension.toLowerCase();
		return this.getWatchedFileTypes().includes(extension);
	}
}
