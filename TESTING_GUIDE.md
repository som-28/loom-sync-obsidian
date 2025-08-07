# 🧪 Testing Guide for Loom Git Sync Plugin

Since the plugin has TypeScript compilation issues with the Obsidian API types, here's a comprehensive guide to test the plugin manually and verify its components.

## 🚀 Quick Testing Methods

### Method 1: Manual Installation & Testing (Recommended)

#### Step 1: Prepare Plugin Files
Since the TypeScript build has issues, we'll use the source files directly:

1. **Copy the working files** to your Obsidian plugins directory:
   ```
   .obsidian/plugins/loom-git-sync/
   ├── manifest.json
   ├── styles.css
   └── main.js (we'll create this manually)
   ```

#### Step 2: Create a Simple main.js for Testing
```javascript
// Basic main.js for testing the plugin structure
const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

class LoomPlugin extends Plugin {
  onload() {
    console.log('Loom Git Sync: Plugin loaded for testing');
    
    // Add a simple command for testing
    this.addCommand({
      id: 'test-loom',
      name: 'Test Loom Plugin',
      callback: () => {
        new Notice('Loom Git Sync is working!');
        console.log('Loom Git Sync: Test command executed');
      }
    });

    // Add simple status bar
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText('Loom: Ready');
    
    // Add settings tab
    this.addSettingTab(new LoomSettingsTab(this.app, this));
  }
}

class LoomSettingsTab extends PluginSettingTab {
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Loom Git Sync Settings' });
    containerEl.createEl('p', { text: 'Plugin is in testing mode.' });
  }
}

module.exports = LoomPlugin;
```

### Method 2: Component Testing

Test individual components separately:

#### Test Git Service
```javascript
// Test in Node.js environment
const { GitService } = require('./src/git-service');
const { DEFAULT_SETTINGS } = require('./src/settings');

async function testGitService() {
  const gitService = new GitService('.', DEFAULT_SETTINGS);
  
  try {
    // Test repository initialization
    await gitService.initRepository();
    console.log('✅ Git repository initialized');
    
    // Test status
    const status = await gitService.getStatus();
    console.log('✅ Git status retrieved:', status);
    
    // Test commit
    await gitService.commit('Test commit from Loom');
    console.log('✅ Test commit successful');
    
  } catch (error) {
    console.log('❌ Git test failed:', error.message);
  }
}

testGitService();
```

#### Test Utilities
```javascript
// Test utility functions
const { debounce, formatTimeAgo, isValidGitUrl } = require('./src/utils');

// Test debounce
console.log('Testing debounce...');
const debouncedFn = debounce(() => console.log('Debounced!'), 1000);
debouncedFn();
debouncedFn();
debouncedFn(); // Should only execute once after delay

// Test URL validation
console.log('GitHub URL valid:', isValidGitUrl('https://github.com/user/repo.git'));
console.log('Invalid URL:', isValidGitUrl('not-a-url'));

// Test time formatting
console.log('Time ago:', formatTimeAgo(new Date(Date.now() - 60000))); // 1 minute ago
```

## 📋 Testing Checklist

### 1. Basic Plugin Loading
- [ ] Plugin appears in Community Plugins list
- [ ] Plugin can be enabled/disabled
- [ ] No console errors during loading
- [ ] Plugin settings tab appears

### 2. Git Integration Testing
- [ ] Repository can be initialized
- [ ] Files can be committed
- [ ] Remote repository can be added
- [ ] Push/pull operations work
- [ ] Status reporting functions

### 3. File Watching (Manual Test)
- [ ] Create a new note - should trigger sync
- [ ] Modify existing note - should trigger sync  
- [ ] Delete note - should be tracked
- [ ] Rename note - should be handled

### 4. UI Components
- [ ] Status bar item appears
- [ ] Status bar shows correct status
- [ ] Settings panel loads without errors
- [ ] All settings can be modified and saved

### 5. Error Handling
- [ ] Invalid Git URL shows appropriate error
- [ ] Network issues are handled gracefully
- [ ] Invalid settings don't crash plugin

## 🔧 Manual Testing Procedure

### Prerequisites
1. **Git installed** on your system
2. **Active internet connection** (for remote testing)
3. **Test repository** on GitHub/GitLab (optional)

### Step-by-Step Testing

#### 1. Installation Test
```bash
# Navigate to your Obsidian vault
cd path/to/your/vault

# Check if .obsidian/plugins directory exists
ls .obsidian/plugins/

# Copy plugin files manually
cp -r path/to/loom-git-sync .obsidian/plugins/
```

#### 2. Git Functionality Test
```bash
# In your vault directory
git init
git add .
git commit -m "Initial test commit"

# Test with remote (optional)
git remote add origin https://github.com/yourusername/test-vault.git
git push -u origin main
```

#### 3. File Change Test
1. Open Obsidian
2. Create a new note
3. Check if Git shows the change: `git status`
4. Modify the note
5. Check Git log: `git log --oneline`

#### 4. Settings Test
1. Open Obsidian Settings
2. Go to Community Plugins
3. Find Loom Git Sync settings
4. Try changing various settings
5. Verify settings are saved

## 🐛 Known Testing Issues & Workarounds

### Issue 1: TypeScript Compilation Errors
**Problem**: Plugin won't build due to Obsidian API type mismatches
**Workaround**: Use simplified JavaScript version for initial testing

### Issue 2: File System Access
**Problem**: Node.js file system access limited in Obsidian
**Workaround**: Test Git operations manually via command line

### Issue 3: Simple-git Dependency
**Problem**: Simple-git may not work in Obsidian's restricted environment
**Workaround**: Use system Git commands via child_process

## 📊 Test Results Template

Create a test results file:

```markdown
# Loom Git Sync - Test Results

## Test Environment
- OS: Windows/macOS/Linux
- Obsidian Version: x.x.x
- Git Version: x.x.x
- Node.js Version: x.x.x

## Test Results

### Basic Functionality
- [ ] Plugin loads: ✅/❌
- [ ] Settings accessible: ✅/❌
- [ ] Commands available: ✅/❌

### Git Operations
- [ ] Repository init: ✅/❌
- [ ] File commits: ✅/❌
- [ ] Remote push: ✅/❌
- [ ] Remote pull: ✅/❌

### File Watching
- [ ] Create detection: ✅/❌
- [ ] Modify detection: ✅/❌
- [ ] Delete detection: ✅/❌

### UI Components
- [ ] Status bar: ✅/❌
- [ ] Settings panel: ✅/❌
- [ ] Notifications: ✅/❌

## Issues Found
1. [List any issues]
2. [With detailed descriptions]
3. [And steps to reproduce]

## Performance Notes
- Memory usage: Normal/High
- CPU usage: Low/Medium/High
- Responsiveness: Good/Slow
```

## 🔄 Iterative Testing Approach

1. **Start Simple**: Test basic plugin loading first
2. **Add Components**: Test one feature at a time
3. **Integration**: Test how features work together
4. **Edge Cases**: Test error conditions and edge cases
5. **Performance**: Test with large vaults and many files

## 📞 Getting Help

If you encounter issues during testing:

1. **Check Browser Console** (F12 in Obsidian)
2. **Review Git Status** (`git status` in vault directory)
3. **Check Plugin Console Logs**
4. **Verify File Permissions**
5. **Test with Minimal Vault** (empty vault with few files)

This testing approach will help identify what's working and what needs refinement before the plugin can be published to the Obsidian community.
