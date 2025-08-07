# Loom Git Sync - Obsidian Plugin

Automatically sync your Obsidian vault with Git repositories in real-time. This plugin replaces the need for a separate 103MB Electron application with a lightweight, native Obsidian solution.

## 🌟 Features

### Real-time Synchronization
- **Automatic file watching**: Monitor all file changes in your vault (create, modify, delete, rename)
- **Smart debouncing**: Avoid excessive commits with configurable delay (default 500ms)
- **Intelligent commit messages**: Automatically generated meaningful commit messages
- **Background syncing**: Non-blocking operations that don't interfere with your workflow

### Git Integration
- **Full Git support**: Initialize repositories, commit, push, pull operations
- **Remote repository support**: Works with GitHub, GitLab, Bitbucket, and custom Git servers
- **Branch management**: Support for multiple branches and branch switching
- **Conflict detection**: Basic merge conflict detection and user notification
- **Authentication**: Support for both SSH and HTTPS authentication methods

### User Interface
- **Status bar integration**: Real-time sync status with clickable indicator
- **Sync panel**: Comprehensive overview of repository status, recent commits, and statistics
- **Settings panel**: Complete configuration interface with real-time validation
- **Command palette**: Quick access to all sync operations
- **Toast notifications**: Optional non-intrusive status updates

### File Management
- **Smart exclusions**: Configurable patterns to exclude temporary and system files
- **Multi-file type support**: Handles Markdown, Canvas, Excalidraw, attachments, and more
- **Rename tracking**: Properly handles file renames as Git operations
- **Large file warnings**: Optional Git LFS integration recommendations

## 📦 Installation

### Community Plugins (Recommended)
1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Loom Git Sync"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract the files to `VaultFolder/.obsidian/plugins/loom-git-sync/`
3. Reload Obsidian and enable the plugin

## 🚀 Quick Start

### First-Time Setup
1. **Enable the plugin** in Obsidian's Community Plugins settings
2. **Configure Git credentials** in the plugin settings:
   - Set your Git username and email
   - Choose authentication method (SSH or HTTPS)
3. **Initialize repository**:
   - Use Command Palette: `Loom: Initialize Git repository`
   - Or click the button in the sync panel
4. **Add remote repository** (optional):
   - Enter your repository URL in settings
   - Test the connection using the "Test" button

### Basic Usage
- **Auto-sync**: Files are automatically committed when changed (if enabled)
- **Manual sync**: Use `Ctrl/Cmd + P` → `Loom: Manual sync now`
- **Monitor status**: Check the status bar indicator for sync status
- **View details**: Click the status bar to open the sync panel

## ⚙️ Configuration

### Repository Settings
- **Remote URL**: Git repository URL (HTTPS or SSH)
- **Branch**: Target branch for synchronization (default: main)
- **Authentication**: Choose between SSH keys or HTTPS credentials

### Sync Options
- **Auto-sync**: Enable/disable automatic synchronization
- **Commit message template**: Customize commit message format
  - `{action}`: The type of change (Created, Updated, Deleted, Renamed)
  - `{filename}`: The name of the changed file
- **Debounce delay**: Time to wait before syncing after changes (100-5000ms)
- **File exclusions**: Glob patterns for files to ignore

### Advanced Options
- **Git user configuration**: Set name and email for commits
- **Auto-push**: Automatically push commits to remote
- **Notifications**: Enable/disable toast notifications
- **Custom .gitignore**: Additional patterns to exclude

## 🔧 Commands

Access these commands via the Command Palette (`Ctrl/Cmd + P`):

- `Loom: Initialize Git repository` - Set up Git in your vault
- `Loom: Manual sync now` - Force immediate synchronization
- `Loom: Push to remote` - Push committed changes to remote
- `Loom: Pull from remote` - Pull changes from remote repository
- `Loom: View sync history` - Open the sync panel
- `Loom: Toggle auto-sync` - Enable/disable automatic syncing
- `Loom: Open settings` - Quick access to plugin settings

## 📊 Status Indicators

The status bar shows different indicators:

- ✅ **Synced** - Everything is up to date
- 🔄 **Syncing...** - Sync operation in progress
- ❌ **Error** - Sync failed (click for details)
- 📡 **Offline** - No remote configured or connection failed

## 🔧 Troubleshooting

### Common Issues

**"Git is not installed or not in PATH"**
- Install Git on your system
- Ensure Git is accessible from command line
- Restart Obsidian after installing Git

**"Authentication failed"**
- For SSH: Set up SSH keys with your Git provider
- For HTTPS: Use personal access tokens instead of passwords
- Test connection in plugin settings

**"Repository not initialized"**
- Use `Loom: Initialize Git repository` command
- Or manually run `git init` in your vault folder

**Files not syncing**
- Check file exclusion patterns in settings
- Verify auto-sync is enabled
- Look for error messages in the sync panel

**Large vault performance**
- Increase debounce delay to reduce commit frequency
- Use file exclusion patterns to ignore unnecessary files
- Consider using Git LFS for large binary files

### Debug Information
1. Open the sync panel to view recent commits and status
2. Check browser developer console for error messages
3. Verify Git repository status using external Git clients

## 🛣️ Roadmap

- [ ] Git LFS integration for large files
- [ ] Conflict resolution interface
- [ ] Multi-vault support
- [ ] Scheduled sync options
- [ ] Sync history visualization
- [ ] Integration with Git hosting services (GitHub, GitLab)
- [ ] Offline queue management
- [ ] Custom hooks and workflows

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/username/loom-git-sync.git
cd loom-git-sync

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Obsidian community
- Inspired by the need for lightweight, integrated version control
- Thanks to all contributors and beta testers

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/username/loom-git-sync/issues)
- **Community Discord**: Join the Obsidian community Discord
- **Documentation**: [Full documentation](https://github.com/username/loom-git-sync/wiki)

---

**Note**: This plugin replaces the standalone Loom Electron application (103MB) with a lightweight, native Obsidian integration. All core functionality is preserved while providing better integration with Obsidian's interface and workflow.
