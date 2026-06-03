# Video Notifier Feature

**Bot Author:** Davidf aka darynx

## Overview

The Video Notifier monitors YouTube and TikTok channels for new uploads and sends rich embedded notifications to a specified Discord channel. It supports community posts via the optional YouTube Data API v3, and falls back to RSS feeds when no API key is configured.

---

## Table of Contents

- [How to Get YouTube Data API Key](#how-to-get-youtube-data-api-key)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)
- [Technical Details](#technical-details)

---

## How to Get YouTube Data API Key

Follow these steps to generate a free YouTube Data API v3 key:

1. **Go to Google Cloud Console**
   - Open your browser and navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

   > **Screenshot Placeholder:** Google Cloud Console dashboard landing page

2. **Create a new project**
   - Click the project dropdown at the top of the page (next to "Google Cloud" logo)
   - Click **New Project**
   - Give it a name (e.g., "Discord Bot" or "Video Notifier")
   - Click **Create**

   > **Screenshot Placeholder:** New Project creation dialog with project name field

3. **Search and enable "YouTube Data API v3"**
   - In the top search bar, type `YouTube Data API v3`
   - Click on **YouTube Data API v3** in the results
   - Click the **Enable** button

   > **Screenshot Placeholder:** API Library page with YouTube Data API v3 selected and Enable button visible

4. **Go to Credentials**
   - In the left sidebar, navigate to **APIs & Services** > **Credentials**
   - Alternatively, use the "Credentials" shortcut after enabling the API

   > **Screenshot Placeholder:** Credentials page showing the "Create Credentials" button

5. **Create an API Key**
   - Click **Create Credentials** at the top
   - Select **API Key** from the dropdown
   - A popup will display your new API key

   > **Screenshot Placeholder:** API key creation popup showing the generated key

6. **Copy the key**
   - Click the **Copy** button to copy your API key to the clipboard
   - Store it securely — you'll add it to your bot configuration
   - Click **Restrict Key** (recommended) to limit usage to the YouTube Data API v3 only

   > **Screenshot Placeholder:** API key restriction page where you can limit the key to specific APIs and IP addresses

### Best Practices

- **Restrict your API key** to only the YouTube Data API v3 to prevent unauthorized usage
- **Do not share your API key** publicly or commit it to version control
- **Set usage quotas** in the Google Cloud Console to avoid unexpected billing (the free tier includes 10,000 units per day)
- **Store the key** in environment variables or `config.json` — never hardcode it in source files

---

## Configuration

The video notifier feature is configured in `config.json` under the `videoNotifier` key. Below is a breakdown of every setting.

### Config Structure

```json
{
  "videoNotifier": {
    "enabled": true,
    "checkInterval": 300000,
    "notificationChannelId": "",
    "youtubeNotificationChannelId": "",
    "tiktokNotificationChannelId": "",
    "youtube": {
      "enabled": true,
      "channels": [],
      "youtubeApiKey": ""
    },
    "tiktok": {
      "enabled": true,
      "channels": []
    },
    "notificationStyle": "embed",
    "embedSettings": {
      "includeDescription": true,
      "descriptionLength": 200
    }
  }
}
```

### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true` | Master toggle for the entire video notifier feature |
| `checkInterval` | number | `300000` | Polling interval in milliseconds (300000 ms = 5 minutes) |
| `notificationChannelId` | string | `""` | Discord channel ID where all notifications are sent (used unless overridden below) |
| `youtubeNotificationChannelId` | string | `""` | *(Optional)* Separate channel for YouTube notifications; falls back to `notificationChannelId` if empty |
| `tiktokNotificationChannelId` | string | `""` | *(Optional)* Separate channel for TikTok notifications; falls back to `notificationChannelId` if empty |
| `youtube.enabled` | boolean | `true` | Enable/disable YouTube monitoring independently |
| `youtube.channels` | array | `[]` | Array of YouTube channel objects to monitor (see [Adding Channels](#adding-channels)) |
| `youtube.youtubeApiKey` | string | `""` | Your YouTube Data API v3 key (see [How to Get One](#how-to-get-youtube-data-api-key)) |
| `tiktok.enabled` | boolean | `true` | Enable/disable TikTok monitoring independently |
| `tiktok.channels` | array | `[]` | Array of TikTok channel objects to monitor |
| `notificationStyle` | string | `"embed"` | Notification format (`"embed"` or `"text"`) |
| `embedSettings.includeDescription` | boolean | `true` | Whether to include the video description in the embed |
| `embedSettings.descriptionLength` | number | `200` | Max characters for the description snippet in embeds |

### Where to Put `youtubeApiKey`

Set the `youtubeApiKey` field inside the `youtube` section of `videoNotifier` in `config.json`:

```json
"youtube": {
  "enabled": true,
  "channels": [...],
  "youtubeApiKey": "AIzaSyYourActualAPIKeyHere"
}
```

You can also set it at runtime using the `/videonotifier set-apikey` command without editing `config.json` manually.

### What Happens With / Without an API Key

| Scenario | RSS Only (no API key) | With YouTube Data API Key |
|----------|-----------------------|---------------------------|
| **Video detection** | ✅ Works (RSS feed polling) | ✅ Works faster and more reliably |
| **Community posts** | ❌ Not detected | ✅ Detected as `bulletin` activities |
| **Update speed** | Slower (RSS polling delay) | Faster (API playlistItems endpoint) |
| **Quota limits** | None (free, no API key) | 10,000 units/day free tier |

### Community Posts vs Videos

The bot distinguishes between two types of content from YouTube channels:

- **Videos** — Standard uploads detected via RSS feed or the `playlistItems` API endpoint
- **Community Posts** — Text/image posts on a channel's Community tab. These are **only** detected when a YouTube Data API key is configured, using the `activities` endpoint with `type=bulletin`

Both types are tracked separately to prevent duplicate notifications.

### Adding Channels

Each channel in the `channels` array is an object:

```json
{
  "id": "UCxxxxxxxxxxxxx",
  "label": "My Favorite Channel"
}
```

For YouTube, `id` is the **channel ID** (starts with `UC`). For TikTok, `id` is the **username** (without `@`).

You can add/remove channels at runtime using the slash commands instead of editing `config.json` directly.

---

## Usage Examples

### Example Config with API Key

```json
{
  "videoNotifier": {
    "enabled": true,
    "checkInterval": 300000,
    "notificationChannelId": "123456789012345678",
    "youtube": {
      "enabled": true,
      "channels": [
        {
          "id": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
          "label": "Google Developers"
        },
        {
          "id": "UCW5YeuMxUllS1L6mBc6tC4g",
          "label": "Tech Channel"
        }
      ],
      "youtubeApiKey": "AIzaSyYourActualAPIKeyHere"
    },
    "tiktok": {
      "enabled": true,
      "channels": [
        {
          "id": "famouscreator",
          "label": "TikTok Creator"
        }
      ]
    },
    "embedSettings": {
      "includeDescription": true,
      "descriptionLength": 200
    }
  }
}
```

### Example Notification Output for Community Post

When the bot detects a new community post, the embed notification looks like this in Discord:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 New Community Post from Google Developers

Check out the latest update from Google Developers!
Click the link to view the full post on YouTube.

📺 Google Developers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> **Screenshot Placeholder:** Discord embed showing a community post notification with channel icon, post text, and timestamp

### Setup YouTube Notifications

```
/videonotifier set-channel channel:#announcements
/videonotifier add-youtube channel-id:UCxxxxxxxxxxxxx label:"My Favorite Channel"
/videonotifier set-apikey key:AIzaSyYourActualAPIKeyHere
/videonotifier test-youtube
```

### Setup TikTok Notifications

```
/videonotifier set-channel channel:#announcements
/videonotifier add-tiktok username:favoriteuser label:"TikTok Creator"
/videonotifier test-tiktok
```

### Monitor Status

```
/videonotifier list
```

---

## Commands Reference

| Command | Description | Permission |
|---------|-------------|------------|
| `/videonotifier list` | List all monitored channels and feature status | Administrator |
| `/videonotifier add-youtube` | Add a YouTube channel (channel ID + optional label) | Administrator |
| `/videonotifier remove-youtube` | Remove a YouTube channel | Administrator |
| `/videonotifier add-tiktok` | Add a TikTok channel (username + optional label) | Administrator |
| `/videonotifier remove-tiktok` | Remove a TikTok channel | Administrator |
| `/videonotifier set-channel` | Set the Discord notification channel | Administrator |
| `/videonotifier set-apikey` | Set the YouTube Data API key | Administrator |
| `/videonotifier toggle` | Enable/disable the video notifier | Administrator |
| `/videonotifier test-youtube` | Send a test YouTube notification | Administrator |
| `/videonotifier test-tiktok` | Send a test TikTok notification | Administrator |

All commands require the **Administrator** permission.

---

## Troubleshooting

### Common Errors

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `No notification channel configured` | `notificationChannelId` is empty and no separate channel IDs set | Run `/videonotifier set-channel` or edit `config.json` |
| `Failed to fetch RSS feed` | Channel ID is invalid or the channel has no videos | Verify the channel ID starts with `UC` and the channel exists |
| `YouTube API returned error` | API key is invalid, restricted, or quota exhausted | Check your API key restrictions and quota in Google Cloud Console |
| `TikTok RSS feed not found` | Username is incorrect or the account doesn't exist | Verify the TikTok username is spelled correctly |
| `Channel already being monitored` | You tried to add a duplicate channel | Use `/videonotifier list` to see existing channels |

### Quota Limits

The YouTube Data API v3 has a **free quota of 10,000 units per day**. Here's how the bot consumes quota:

| Operation | Cost (units) | Frequency |
|-----------|-------------|-----------|
| `playlistItems.list` (video check) | 1 | Every check interval per channel |
| `activities.list` (community post check) | 1 | Every check interval per channel |

**Example:** Monitoring 5 YouTube channels with a 5-minute check interval:
- Video checks: 5 channels × 1 unit × 288 checks/day = 1,440 units/day
- Community post checks: 5 channels × 1 unit × 288 checks/day = 1,440 units/day
- **Total: 2,880 units/day** — well within the free tier

> **Note:** The bot falls back to RSS feeds (which have no quota limits) when no API key is configured. Community post detection is the main feature that requires the API key.

### API Key Not Working

If you've added your API key but the bot isn't detecting community posts or is showing errors:

1. **Verify the key is correct** — Run `/videonotifier list` and check that the API key shows as configured
2. **Check API restrictions** — In Google Cloud Console > Credentials, click your API key. Ensure the "API restrictions" setting is not blocking the YouTube Data API v3
3. **Check if the API is enabled** — Go to APIs & Services > Library and confirm "YouTube Data API v3" shows as enabled
4. **Wait for propagation** — New API keys and API enablement can take a few minutes to propagate
5. **Test the key manually** — Open this URL in your browser (replace `YOUR_KEY`):
   ```
   https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=YOUR_KEY
   ```
   A valid key returns JSON channel data. An invalid or restricted key returns an error.

### Debugging Tips

- Enable verbose logging by setting the log level in `config.json`:
  ```json
  "logging": {
    "modules": {
      "VideoNotifierManager": "DEBUG"
    }
  }
  ```
- Run `/videonotifier test-youtube` to verify the notification channel works without waiting for a new upload
- Run `/videonotifier list` to see the current configuration status and whether the API key is configured

---

## Files Changed

### 1. `package.json`
- Added `rss-parser` dependency for parsing RSS feeds

### 2. `config.json`
- Added `videoNotifier` configuration section with all settings described above

### 3. `index.js`
- Imported `VideoNotifierManager`
- Initialized `videoNotifierManager` instance
- Attached manager to `client.videoNotifierManager`

### 4. `events/ready.js`
- Added code to start `videoNotifierManager` when bot is ready (if feature enabled)

### 5. `utils/VideoNotifierManager.js` (NEW)
- Core manager class for video notifications
- Polls RSS feeds for YouTube and TikTok channels
- Tracks last known video per channel to detect new uploads
- Sends Discord embeds with thumbnail + video link
- Methods for adding/removing channels, listing channels, and updating configuration
- Test notification methods for YouTube and TikTok
- YouTube: Uses `https://www.youtube.com/feeds/videos.xml?channel_id=`
- TikTok: Uses `https://www.tiktok.com/@username/rss`

### 6. `commands/videonotifier.js` (NEW)
- Slash command with all subcommands listed above
- Requires Administrator permission
- Provides rich embed responses

### 7. YouTube Data API Integration (NEW)
- Optional integration with YouTube Data API v3
- Provides support for YouTube Community Posts detection
- Faster and more reliable video updates
- Bypasses some RSS feed limitations
- Configurable via `/videonotifier set-apikey`
- Falls back to RSS if no API key is provided

### 8. `README.md`
- Updated features list
- Added Video Notifier section with setup instructions
- Updated commands table with test commands
- Updated project structure
- Added configuration options table

---

## Technical Details

### RSS Feed Parsing
- Uses `rss-parser` library with custom fields for YouTube media:thumbnail
- Handles timeouts gracefully (10 second timeout)
- Supports both YouTube channel IDs and TikTok usernames

### YouTube Data API Integration
- Uses `activities` endpoint for community post detection
- Uses `playlistItems` endpoint for upload detection (highly efficient)
- Detects `bulletin` type activities as community posts
- Separate tracking for videos and community posts to prevent duplicate notifications

### Duplicate Prevention
- Tracks last known video ID per channel in memory Map
- Tracks last known community post ID per channel in memory Map
- Only sends notifications when new ID is detected
- Differentiates by platform (youtube:channelId, youtube:community:channelId, tiktok:username)

### Discord Embeds
- YouTube embeds include:
  - Thumbnail from media:thumbnail or YouTube default
  - Video title (clickable link)
  - Description snippet (configurable length)
  - Channel label with YouTube icon
  - Timestamp
- TikTok embeds include:
  - Video title (clickable link)
  - Description snippet
  - Channel label with TikTok icon
  - Timestamp

### Test Notifications
- `/videonotifier test-youtube` - Sends a test YouTube notification
- `/videonotifier test-tiktok` - Sends a test TikTok notification
- Useful for verifying configuration without waiting for new uploads

### Error Handling
- Gracefully handles RSS feed failures without crashing
- Logs errors with context (which channel failed and why)
- Continues checking other channels even if one fails
- Warns when notification channel is not configured

### Configuration
- All settings in config.json
- Can be modified at runtime via commands
- Feature can be toggled on/off without restarting bot
- Polling interval is configurable

---

## Benefits

1. **No API Keys Required**: Default uses public RSS feeds
2. **Optional YouTube Data API**: Enhanced support for community posts and reliability
3. **Easy to Use**: Simple slash commands for management
4. **Test Commands**: Verify setup with test notifications
5. **Configurable**: Adjust check interval, embed settings, etc.
6. **Duplicate Prevention**: Tracks last video/post to avoid spam
7. **Rich Notifications**: Beautiful embeds with thumbnails (YouTube)
8. **Multi-Platform**: Supports both YouTube and TikTok
9. **Admin Control**: Requires admin permissions to manage
10. **Non-Intrusive**: Only notifies when NEW content is posted
11. **Separate Channels**: Optional separate channels for YouTube and TikTok

---

## Future Enhancements (Optional)

- Add file persistence for last video IDs (survives bot restart)
- Support for multiple notification channels per server
- Support for YouTube playlists
- Custom embed colors per channel
- Filter by keywords in video title
- Support for more platforms (Instagram, Twitter, etc.)

---

**Created by Davidf aka darynx**