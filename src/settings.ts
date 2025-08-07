export interface LoomSettings {
	// Repository settings
	remoteUrl: string;
	branch: string;
	authMethod: 'ssh' | 'https';
	
	// Sync options
	autoSync: boolean;
	commitMessageTemplate: string;
	debounceDelay: number;
	excludePatterns: string[];
	
	// Advanced options
	gitUserName: string;
	gitUserEmail: string;
	autoPush: boolean;
	showNotifications: boolean;
	
	// Internal settings
	lastSync: number;
	repositoryInitialized: boolean;
}

export const DEFAULT_SETTINGS: LoomSettings = {
	// Repository settings
	remoteUrl: '',
	branch: 'main',
	authMethod: 'https',
	
	// Sync options
	autoSync: true,
	commitMessageTemplate: '{action}: {filename}',
	debounceDelay: 500,
	excludePatterns: [
		'.obsidian/workspace.json',
		'.obsidian/workspace-mobile.json',
		'.obsidian/cache',
		'*.tmp',
		'*~',
		'.DS_Store',
		'Thumbs.db'
	],
	
	// Advanced options
	gitUserName: '',
	gitUserEmail: '',
	autoPush: false,
	showNotifications: true,
	
	// Internal settings
	lastSync: 0,
	repositoryInitialized: false
};
