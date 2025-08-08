# Loom Git Sync - Obsidian Plugin

🚀 Real-time Git synchronization for Obsidian - Automatically sync your vault changes to GitHub with smart file watching.

A lightweight Obsidian plugin that automatically synchronizes your vault with Git repositories in real-time. Say goodbye to heavy 103MB Electron applications and enjoy seamless, native Git integration.

## ✨ Features

### 🔄 Real-time Synchronization
- **Automatic file watching**: Monitors all file changes in your vault (create, modify, delete, rename)
- **Smart debouncing**: Configurable delay to avoid excessive commits (default 500ms)
- **Auto-commit and push**: Automatically commits changes and pushes to your GitHub repository
- **Background syncing**: Non-blocking operations that don't interfere with your workflow

### 🎯 Smart File Management
- **File exclusion patterns**: Configure which files to ignore during sync
- **Multi-file type support**: Handles Markdown, images, PDFs, and other attachments

### 🖥️ User Interface
- **Status bar integration**: Real-time sync status with visual indicators
- **Settings panel**: Easy configuration with all available options
- **Toast notifications**: Optional status updates for sync operations
- **Command palette integration**: Quick access to manual sync and settings

### ⚙️ Configuration Options
- **Remote repository URL**: Connect to your GitHub repository
- **Custom commit messages**: Template-based commit message generation
- **Sync preferences**: Enable/disable auto-sync, notifications, and file watching
- **Debounce timing**: Adjust delay between file changes and sync operations

## � Screenshots

### Plugin Settings Panel
![Settings Panel](screenshots/Screenshot%202025-08-08%20053935.png)

![Status Bar](screenshots/Screenshot%202025-08-08%20053943.png)

### Status Bar Integratio
![Plugin Interface](screenshots/Screenshot%202025-08-08%20053958.png)

## �📦 Installation

### Step-by-Step Manual Installation

Since this plugin is not yet available in the Community Plugins store, you'll need to install it manually. Follow these detailed steps:

#### Step 1: Download Plugin Files
1. Download or copy these three essential files from the plugin repository:
   - `main.js` (the main plugin code)
   - `manifest.json` (plugin metadata)
   - `styles.css` (plugin styling)

#### Step 2: Locate Your Obsidian Vault
1. Open your Obsidian vault in File Explorer/Finder
2. Navigate to your vault's root directory (where your notes are stored)

#### Step 3: Access the Plugins Directory
1. Look for a folder named `.obsidian` in your vault directory
   - **If you don't see it**: This folder might be hidden. Enable "Show hidden files" in your file manager
   - **If it doesn't exist**: Open Obsidian, go to Settings → Community Plugins, and turn on "Community plugins" first. This will create the necessary folders.

2. Inside `.obsidian`, look for a `plugins` folder
   - **If it doesn't exist**: Create a new folder named `plugins`

#### Step 4: Create Plugin Directory
1. Inside the `plugins` folder, create a new folder named exactly: `loom-git-sync`
2. Your path should now look like: `YourVault/.obsidian/plugins/loom-git-sync/`

#### Step 5: Copy Plugin Files
1. Copy the three plugin files (`main.js`, `manifest.json`, `styles.css`) into the `loom-git-sync` folder
2. Your final directory structure should be:
   ```
   YourVault/
   ├── .obsidian/
   │   └── plugins/
   │       └── loom-git-sync/
   │           ├── main.js
   │           ├── manifest.json
   │           └── styles.css
   └── (your notes and other files)
   ```

#### Step 6: Enable the Plugin
1. **Restart Obsidian** or reload the app
2. Go to **Settings** → **Community Plugins**
3. You should see "Loom - Real-time Git Sync" in your installed plugins list
4. **Toggle it ON** to enable the plugin
5. The plugin should now be active and ready to configure

#### Verification
- Check if you see a sync status indicator in your status bar (bottom of Obsidian)
- Try accessing the plugin settings: Settings → Community Plugins → Loom - Real-time Git Sync → Settings icon

## 🚀 Quick Start

1. **Enable the plugin** in Obsidian's Community Plugins settings
2. **Configure your GitHub repository**:
   - Go to plugin settings
   - Enter your repository URL (e.g., `https://github.com/username/your-repo.git`)
3. **Initialize Git in your vault** (if not already done):
   - The plugin will automatically set up Git in your vault directory
   - Creates a `.gitignore` file with sensible defaults
4. **Start syncing**: Changes will automatically sync when you modify files

## ⚙️ Settings

### Repository Configuration
- **Remote Repository URL**: Your Git repository URL
- **Auto-sync**: Enable/disable automatic synchronization

### Sync Behavior
- **Debounce Delay**: Time to wait after file changes before syncing (100-2000ms)
- **Show Notifications**: Enable/disable toast notifications
- **File Exclusion Patterns**: Glob patterns for files to ignore (e.g., `*.tmp`, `.obsidian/workspace*`)

### Commit Settings
- **Commit Message Template**: Customize how commit messages are generated
  - `{action}`: Type of change (Created, Updated, Deleted)
  - `{filename}`: Name of the changed file

## 🔧 Commands

Available via Command Palette (`Ctrl/Cmd + P`):
- `Loom: Toggle auto-sync` - Enable/disable automatic syncing
- `Loom: Manual sync now` - Force immediate synchronization
- `Loom: Open settings` - Access plugin configuration

## 📊 Status Indicators

Status bar shows current sync state:
- ✅ **Synced** - All changes are synchronized
- 🔄 **Syncing...** - Sync operation in progress  
- ❌ **Error** - Sync failed (check console for details)
- ⚠️ **No Remote** - Repository URL not configured

## 🔧 Troubleshooting

### Common Issues

**Plugin loaded but changes not syncing:**
- Ensure Git is installed on your system and accessible from command line
- Check that your repository URL is correct in settings
- Verify that your vault directory has been initialized as a Git repository

**Files not being tracked:**
- Check your exclusion patterns in settings
- Verify the files aren't already ignored by `.gitignore`

## 🤝 Contributing

Found a bug or want to contribute? Please open an issue or submit a pull request on GitHub.

## 📝 License

MIT License - feel free to use and modify as needed.

---

**Note**: This plugin provides a lightweight alternative to standalone Git synchronization applications, integrating directly with Obsidian for seamless version control of your notes.
