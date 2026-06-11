import { createLogger } from '../utils/Logger.js';

const logger = createLogger('EmbedCreatorModal');

async function updatePreview(interaction) {
  const userId = interaction.user.id;
  const message = interaction.client.embedCreatorManager.buildMessage(userId, { includeComponents: true });
  const state = interaction.client.embedCreatorManager.getOrCreateState(userId);
  const targetChannel = interaction.client.channels.cache.get(state.targetChannelId);

  let separatorList = '';
  if (state.v2.separators && state.v2.separators.length > 0) {
    separatorList = `\n**Separators after indices:** ${state.v2.separators.join(', ')}`;
  }

  let labelList = '';
  if (state.v2.labels && state.v2.labels.length > 0) {
    labelList = `\n**Labels:** ${state.v2.labels.join(', ')}`;
  }

  let galleryInfo = '';
  if (state.v2.mediaGallery && state.v2.mediaGallery.length > 0) {
    galleryInfo = `\n**Gallery Items:** ${state.v2.mediaGallery.length}`;
  }

  let thumbnailInfo = '';
  if (state.v2.thumbnail && state.v2.thumbnail.length > 0) {
    thumbnailInfo = `\n**Thumbnail:** ✅ Set`;
  }

  await interaction.update({
    content: `### Embed Creator\nYou are creating a message for ${targetChannel || 'unknown channel'}.\nUse the buttons below to customize your message.${separatorList}${labelList}${galleryInfo}${thumbnailInfo}`,
    ...message
  });
}

const modals = [
  {
    customId: 'embed_creator_modal_title',
    async execute(interaction) {
      const title = interaction.fields.getTextInputValue('title_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { title });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_description',
    async execute(interaction) {
      const description = interaction.fields.getTextInputValue('description_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { description });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_color',
    async execute(interaction) {
      let color = interaction.fields.getTextInputValue('color_input');
      if (color && !color.startsWith('#')) color = '#' + color;
      
      // Simple hex validation
      if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
        return interaction.reply({ content: 'Invalid hex color format. Use something like #0099ff', ephemeral: true });
      }

      interaction.client.embedCreatorManager.updateState(interaction.user.id, { color: color || undefined });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_footer',
    async execute(interaction) {
      const text = interaction.fields.getTextInputValue('footer_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { footer: { text } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_field',
    async execute(interaction) {
      const name = interaction.fields.getTextInputValue('field_name');
      const value = interaction.fields.getTextInputValue('field_value');
      const inline = interaction.fields.getTextInputValue('field_inline').toLowerCase() === 'yes';
      
      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      state.embed.fields.push({ name, value, inline });
      
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_image',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('image_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { image: { url } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_thumbnail',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('thumbnail_input');
      interaction.client.embedCreatorManager.updateState(interaction.user.id, { thumbnail: { url } });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_textdisplay',
    async execute(interaction) {
      const content = interaction.fields.getTextInputValue('text_input');
      interaction.client.embedCreatorManager.addTextDisplay(interaction.user.id, content);
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_separator',
    async execute(interaction) {
      const indexStr = interaction.fields.getTextInputValue('index_input');
      const index = parseInt(indexStr);
      
      if (isNaN(index)) {
        return interaction.reply({ content: 'Please enter a valid number for the index.', ephemeral: true });
      }

      const state = interaction.client.embedCreatorManager.getOrCreateState(interaction.user.id);
      if (index < 0 || index >= state.v2.textDisplays.length) {
        return interaction.reply({ content: `Invalid index. Please enter a number between 0 and ${state.v2.textDisplays.length - 1}.`, ephemeral: true });
      }

      if (state.v2.separators.includes(index)) {
        interaction.client.embedCreatorManager.removeSeparator(interaction.user.id, index);
      } else {
        interaction.client.embedCreatorManager.addSeparator(interaction.user.id, index);
      }
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_button',
    async execute(interaction) {
      const label = interaction.fields.getTextInputValue('button_label');
      const customId = interaction.fields.getTextInputValue('button_id');
      
      interaction.client.embedCreatorManager.addButton(interaction.user.id, { label, customId: customId || undefined });
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_label',
    async execute(interaction) {
      const content = interaction.fields.getTextInputValue('label_input');
      if (!content || !content.trim()) {
        return interaction.reply({ content: 'Label text cannot be empty.', ephemeral: true });
      }
      interaction.client.embedCreatorManager.addLabel(interaction.user.id, content.trim());
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_thumbnail',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('thumbnail_input');
      if (url && url.trim()) {
        const trimmed = url.trim();
        // Basic URL validation
        if (!/^https?:\/\/.+/.test(trimmed)) {
          return interaction.reply({ content: 'Please enter a valid URL (starting with http:// or https://).', ephemeral: true });
        }
        interaction.client.embedCreatorManager.setV2Thumbnail(interaction.user.id, trimmed);
      } else {
        // Empty input clears the thumbnail
        interaction.client.embedCreatorManager.setV2Thumbnail(interaction.user.id, '');
      }
      await updatePreview(interaction);
    }
  },
  {
    customId: 'embed_creator_modal_v2_mediagallery',
    async execute(interaction) {
      const url = interaction.fields.getTextInputValue('gallery_input');
      if (!url || !url.trim()) {
        return interaction.reply({ content: 'Please enter a URL for the gallery item.', ephemeral: true });
      }
      const trimmed = url.trim();
      // Basic URL validation
      if (!/^https?:\/\/.+/.test(trimmed)) {
        return interaction.reply({ content: 'Please enter a valid URL (starting with http:// or https://).', ephemeral: true });
      }
      interaction.client.embedCreatorManager.addMediaGalleryItem(interaction.user.id, trimmed);
      await updatePreview(interaction);
    }
  }
];

export default modals;
