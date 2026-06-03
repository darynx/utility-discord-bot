import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('videonotifier')
    .setDescription('Manage YouTube/TikTok video notifications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all monitored channels'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('lookup')
        .setDescription('Look up a YouTube Channel ID from a username')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('The YouTube username (with or without @)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-youtube')
        .setDescription('Add a YouTube channel to monitor')
        .addStringOption(option =>
          option
            .setName('channel-id')
            .setDescription('The YouTube channel ID')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Custom label for the channel')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-youtube-force')
        .setDescription('Add a YouTube channel to monitor without RSS validation')
        .addStringOption(option =>
          option
            .setName('channel-id')
            .setDescription('The YouTube channel ID')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Custom label for the channel')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-youtube')
        .setDescription('Remove a YouTube channel from monitoring')
        .addStringOption(option =>
          option
            .setName('channel-id')
            .setDescription('The YouTube channel ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-tiktok')
        .setDescription('Add a TikTok channel to monitor')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('The TikTok username (without @)')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Custom label for the channel')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-tiktok')
        .setDescription('Remove a TikTok channel from monitoring')
        .addStringOption(option =>
          option
            .setName('username')
            .setDescription('The TikTok username (without @)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-channel')
        .setDescription('Set the Discord channel for notifications')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true))
        .addStringOption(option =>
          option
            .setName('message')
            .setDescription('The message to send when a new video is posted')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle the video notifier on or off'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test-youtube')
        .setDescription('Send a test YouTube notification'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test-tiktok')
        .setDescription('Send a test TikTok notification'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-style')
        .setDescription('Set the notification style (embed vs simple)')
        .addStringOption(option =>
          option
            .setName('style')
            .setDescription('The notification style')
            .setRequired(true)
            .addChoices(
              { name: 'Rich Embed (Default)', value: 'embed' },
              { name: 'Simple Text', value: 'simple' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-apikey')
        .setDescription('Set the YouTube Data API key for community posts and faster updates')
        .addStringOption(option =>
          option
            .setName('key')
            .setDescription('Your YouTube Data API v3 key')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const manager = interaction.client.videoNotifierManager;

    if (!manager) {
      return interaction.reply({
        content: '❌ Video notifier manager is not initialized',
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'list':
        return handleList(interaction, manager);
      case 'lookup':
        return handleLookupYouTube(interaction, manager);
      case 'add-youtube':
        return handleAddYouTube(interaction, manager);
      case 'add-youtube-force':
        return handleAddYouTubeForce(interaction, manager);
      case 'remove-youtube':
        return handleRemoveYouTube(interaction, manager);
      case 'add-tiktok':
        return handleAddTikTok(interaction, manager);
      case 'remove-tiktok':
        return handleRemoveTikTok(interaction, manager);
      case 'set-channel':
        return handleSetChannel(interaction, manager);
      case 'set-style':
        return handleSetStyle(interaction, manager);
      case 'toggle':
        return handleToggle(interaction, manager);
      case 'set-apikey':
        return handleSetApiKey(interaction, manager);
      case 'test-youtube':
        return handleTestYouTube(interaction, manager);
      case 'test-tiktok':
        return handleTestTikTok(interaction, manager);
    }
  }
};

async function handleSetApiKey(interaction, manager) {
  const key = interaction.options.getString('key');
  
  // Basic validation of the key format
  if (!key || key.length < 30) {
    return interaction.reply({
      content: '❌ Invalid YouTube API key format. Please provide a valid API key from Google Cloud Console.',
      ephemeral: true
    });
  }

  const youtubeConfig = { ...manager.config.videoNotifier.youtube, youtubeApiKey: key };
  const result = await manager.updateConfig({ youtube: youtubeConfig });
  
  if (result.success) {
    await interaction.reply({
      content: '✅ YouTube API key has been set! The bot will now use the YouTube Data API for faster updates and community posts.',
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleTestYouTube(interaction, manager) {
  try {
    await interaction.deferReply({ ephemeral: true });
    await manager.sendTestYouTubeNotification();
    await interaction.editReply('✅ Test YouTube notification sent!');
  } catch (error) {
    await interaction.editReply(`❌ Error sending test notification: ${error.message}`);
  }
}

async function handleTestTikTok(interaction, manager) {
  try {
    await interaction.deferReply({ ephemeral: true });
    await manager.sendTestTikTokNotification();
    await interaction.editReply('✅ Test TikTok notification sent!');
  } catch (error) {
    await interaction.editReply(`❌ Error sending test notification: ${error.message}`);
  }
}

async function handleLookupYouTube(interaction, manager) {
  const username = interaction.options.getString('username');
  await interaction.deferReply({ ephemeral: true });

  const result = await manager.lookupChannelId(username);

  if (result.success) {
    const embed = {
      color: manager.config.embedColors.success,
      title: '🔍 YouTube Channel Lookup',
      thumbnail: {
        url: result.thumbnail || 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: '👤 Username', value: username.startsWith('@') ? username : `@${username}`, inline: true },
        { name: '📺 Channel Name', value: result.channelName, inline: true },
        { name: '🆔 Channel ID', value: `\`${result.channelId}\``, inline: false },
        { name: '💡 Tip', value: `You can now use this ID with \`/videonotifier add-youtube channel-id:${result.channelId}\``, inline: false }
      ],
      timestamp: new Date(),
      footer: {
        text: 'YouTube Lookup',
        iconURL: 'https://www.youtube.com/favicon.ico'
      }
    };
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.editReply({
      content: `❌ ${result.message}`
    });
  }
}

async function handleList(interaction, manager) {
  const channels = manager.listChannels();
  
  const youtubeList = channels.youtube.length > 0
    ? channels.youtube.map(c => {
        let suffix = '';
        if (c.validatedVia === 'force') suffix = ' (⚠️ Forced)';
        else if (c.validatedVia === 'api') suffix = ' (✅ API)';
        return `• ${c.label || c.id} (${c.id})${suffix}`;
      }).join('\n')
    : 'None';
  
  const tiktokList = channels.tiktok.length > 0
    ? channels.tiktok.map(c => `• ${c.label || c.username} (@${c.username})`).join('\n')
    : 'None';

  const config = manager.config.videoNotifier;
  const status = config?.enabled ? '✅ Enabled' : '❌ Disabled';
  const checkInterval = config?.checkInterval ? `${config.checkInterval / 1000}s` : 'N/A';
  const notificationChannel = config?.notificationChannelId 
    ? `<#${config.notificationChannelId}>` 
    : 'Not set';
  const style = config?.notificationStyle === 'simple' ? 'Simple Text' : 'Rich Embed (Default)';

  const embed = {
    color: manager.config.embedColors.videoNotifier || manager.config.embedColors.primary,
    title: '📺 Video Notifier Status',
    fields: [
      { name: 'Status', value: status, inline: true },
      { name: 'Check Interval', value: checkInterval, inline: true },
      { name: 'Style', value: style, inline: true },
      { name: 'Notification Channel', value: notificationChannel, inline: false },
      { name: 'YouTube Channels', value: youtubeList, inline: false },
      { name: 'TikTok Channels', value: tiktokList, inline: false }
    ],
    timestamp: new Date()
  };

  await interaction.reply({ embeds: [embed] });
}

async function handleAddYouTube(interaction, manager) {
  let channelId = interaction.options.getString('channel-id');
  const label = interaction.options.getString('label');

  await interaction.deferReply({ ephemeral: true });

  // Handle @username format - auto-lookup
  if (channelId.startsWith('@')) {
    await interaction.editReply({ content: `🔍 Looking up ${channelId}...` });

    const lookupResult = await manager.lookupChannelId(channelId);
    if (!lookupResult.success) {
      let message = `❌ Could not resolve YouTube username ${channelId} to a Channel ID. ${lookupResult.message}`;

      // Suggest setting an API key if one isn't configured
      const apiKey = manager.config.videoNotifier?.youtube?.youtubeApiKey;
      if (!apiKey) {
        message += '\n\n💡 **Tip:** Set a YouTube API key with `/videonotifier set-apikey` for more reliable and faster lookups.';
      }

      return interaction.editReply({ content: message });
    }

    channelId = lookupResult.channelId;
    await interaction.editReply({
      content: `✅ Found! Channel ID: \`${channelId}\` (${lookupResult.channelName})`
    });
  }

  // Step 1: Validate the channel first
  await interaction.editReply({
    content: `🔄 Validating channel (RSS${manager.config.videoNotifier?.youtube?.youtubeApiKey ? '/API' : ''})...`
  });

  const validation = await manager.validateYouTubeChannel(channelId);

  if (!validation.success) {
    const embed = {
      color: manager.config.embedColors.error,
      title: '❌ YouTube Channel Validation Failed',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: 'Channel ID', value: `\`${channelId}\``, inline: false }
      ],
      timestamp: new Date()
    };

    // Add error message
    embed.fields.push({ 
      name: '❌ Error', 
      value: validation.message, 
      inline: false 
    });

    // Add detailed explanation if available
    if (validation.details) {
      embed.fields.push({ 
        name: 'ℹ️ Details', 
        value: validation.details, 
        inline: false 
      });
    }

    // Add helpful tip for invalid format
    if (validation.message.includes('Invalid YouTube Channel ID format')) {
      embed.fields.push({
        name: '💡 How to find your Channel ID',
        value: '1. Go to YouTube Studio\n2. Click Settings (gear icon)\n3. Select "Channel" then "Advanced Settings"\n4. Copy the "Channel ID" (starts with UC)',
        inline: false
      });
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // Step 2: Add the channel after successful validation
  const result = await manager.addYouTubeChannel(channelId, label, validation.validatedVia);

  if (result.success) {
    const channelInfo = validation.channelInfo;
    const latestVideo = channelInfo.latestVideo;

    const embed = {
      color: manager.config.embedColors.success,
      title: '✅ YouTube Channel Added Successfully',
      url: channelInfo.link || `https://www.youtube.com/channel/${channelId}`,
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: '📺 Channel Name', value: channelInfo.title, inline: true },
        { name: '🆔 Channel ID', value: `\`${channelId}\``, inline: true },
        { name: '🏷️ Label', value: label || 'None', inline: true }
      ],
      timestamp: new Date(),
      footer: {
        text: 'YouTube',
        iconURL: 'https://www.youtube.com/favicon.ico'
      }
    };

    if (latestVideo) {
      embed.fields.push(
        { name: '\u200b', value: '\u200b', inline: false },
        { name: '🎬 Latest Video', value: `[${latestVideo.title}](${latestVideo.link})`, inline: false }
      );
      if (latestVideo.pubDate) {
        const pubDate = new Date(latestVideo.pubDate);
        embed.fields.push({ 
          name: '📅 Published', 
          value: `<t:${Math.floor(pubDate.getTime() / 1000)}:R>`, 
          inline: true 
        });
      }
    }

    return interaction.editReply({ embeds: [embed] });
  } else {
    const embed = {
      color: manager.config.embedColors.error,
      title: '❌ Failed to Add Channel',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: 'Channel ID', value: `\`${channelId}\``, inline: false },
        { name: '❌ Error', value: result.message, inline: false }
      ],
      timestamp: new Date()
    };
    return interaction.editReply({ embeds: [embed] });
  }
}

async function handleAddYouTubeForce(interaction, manager) {
  const channelId = interaction.options.getString('channel-id');
  const label = interaction.options.getString('label');

  await interaction.deferReply({ ephemeral: true });

  const result = await manager.addYouTubeChannelForce(channelId, label);

  if (result.success) {
    const embed = {
      color: manager.config.embedColors.success,
      title: '✅ YouTube Channel Force-Added',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: '🆔 Channel ID', value: `\`${channelId}\``, inline: true },
        { name: '🏷️ Label', value: label || 'None', inline: true },
        { name: '⚠️ Note', value: 'Validation was skipped. The bot will try to fetch the latest video during the next check.', inline: false }
      ],
      timestamp: new Date(),
      footer: {
        text: 'YouTube (Force-Added)',
        iconURL: 'https://www.youtube.com/favicon.ico'
      }
    };

    return interaction.editReply({ embeds: [embed] });
  } else {
    const embed = {
      color: manager.config.embedColors.error,
      title: '❌ Failed to Force-Add Channel',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png'
      },
      fields: [
        { name: 'Channel ID', value: `\`${channelId}\``, inline: false },
        { name: '❌ Error', value: result.message, inline: false }
      ],
      timestamp: new Date()
    };
    return interaction.editReply({ embeds: [embed] });
  }
}

async function handleRemoveYouTube(interaction, manager) {
  const channelId = interaction.options.getString('channel-id');

  const result = await manager.removeYouTubeChannel(channelId);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleAddTikTok(interaction, manager) {
  const username = interaction.options.getString('username');
  const label = interaction.options.getString('label');

  await interaction.deferReply({ ephemeral: true });

  // Step 1: Validate the channel first
  const validation = await manager.validateTikTokChannel(username);

  if (!validation.success) {
    const embed = {
      color: manager.config.embedColors.error,
      title: '❌ TikTok Account Validation Failed',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png'
      },
      fields: [
        { name: 'Username', value: `@${username}`, inline: false }
      ],
      timestamp: new Date()
    };

    // Add error message
    embed.fields.push({ 
      name: '❌ Error', 
      value: validation.message, 
      inline: false 
    });

    // Add detailed explanation if available
    if (validation.details) {
      embed.fields.push({ 
        name: 'ℹ️ Details', 
        value: validation.details, 
        inline: false 
      });
    }

    // Add helpful tip for invalid format
    if (validation.message.includes('Invalid TikTok username format')) {
      embed.fields.push({
        name: '💡 Correct format',
        value: 'Enter just the username without the @ symbol.\nExamples: `charlidamelio`, `tiktok`, `username123`',
        inline: false
      });
    }

    return interaction.editReply({ embeds: [embed] });
  }

  // Step 2: Add the channel after successful validation
  const result = await manager.addTikTokChannel(username, label);

  if (result.success) {
    const channelInfo = validation.channelInfo;
    const profileUrl = `https://www.tiktok.com/@${username}`;

    const embed = {
      color: manager.config.embedColors.success,
      title: '✅ TikTok Account Added Successfully',
      url: profileUrl,
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png'
      },
      fields: [
        { name: '👤 Username', value: `@${username}`, inline: true },
        { name: '🏷️ Label', value: label || 'None', inline: true }
      ],
      timestamp: new Date(),
      footer: {
        text: 'TikTok',
        iconURL: 'https://www.tiktok.com/favicon.ico'
      }
    };

    // Add note about RSS if present
    if (validation.note) {
      embed.fields.push({
        name: '⚠️ Note',
        value: validation.note,
        inline: false
      });
    }

    return interaction.editReply({ embeds: [embed] });
  } else {
    const embed = {
      color: manager.config.embedColors.error,
      title: '❌ Failed to Add Account',
      thumbnail: {
        url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png'
      },
      fields: [
        { name: 'Username', value: `@${username}`, inline: false },
        { name: '❌ Error', value: result.message, inline: false }
      ],
      timestamp: new Date()
    };
    return interaction.editReply({ embeds: [embed] });
  }
}

async function handleRemoveTikTok(interaction, manager) {
  const username = interaction.options.getString('username');

  const result = await manager.removeTikTokChannel(username);
  
  if (result.success) {
    await interaction.reply({
      content: `✅ ${result.message}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleSetChannel(interaction, manager) {
  const channel = interaction.options.getChannel('channel');
  const customMessage = interaction.options.getString('message');
  
  const configUpdates = { notificationChannelId: channel.id };
  if (customMessage) {
    configUpdates.notificationMessage = customMessage;
  }
  
  const result = await manager.updateConfig(configUpdates);
  
  if (result.success) {
    let response = `✅ Notification channel set to ${channel}`;
    if (customMessage) {
      response += `\n✅ Notification message set to: ${customMessage}`;
    }
    await interaction.reply({
      content: response,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleToggle(interaction, manager) {
  const currentStatus = manager.config.videoNotifier?.enabled ?? true;
  const newStatus = !currentStatus;
  
  const result = await manager.updateConfig({ enabled: newStatus });
  
  if (result.success) {
    if (newStatus) {
      manager.start();
    } else {
      manager.stop();
    }
    
    await interaction.reply({
      content: `✅ Video notifier ${newStatus ? 'enabled' : 'disabled'}`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}

async function handleSetStyle(interaction, manager) {
  const style = interaction.options.getString('style');
  
  const result = await manager.updateConfig({ notificationStyle: style });
  
  if (result.success) {
    const styleName = style === 'simple' ? 'Simple Text' : 'Rich Embed';
    await interaction.reply({
      content: `✅ Notification style set to **${styleName}**`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: `❌ ${result.message}`,
      ephemeral: true
    });
  }
}
