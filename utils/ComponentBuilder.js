export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  StringSelect: 3,
  TextInput: 4,
  UserSelect: 5,
  RoleSelect: 6,
  MentionableSelect: 7,
  ChannelSelect: 8,
  Section: 9,
  TextDisplay: 10,
  File: 13,
  Separator: 14,
  Form: 15,
  Inputs: 16,
  Container: 17,
  Label: 18,
  Thumbnail: 24,
  MediaGallery: 25,
};

export class ComponentBuilder {
  static createContainer({ description, components = [], accentColor = null }) {
    const container = {
      type: ComponentType.Container,
      components: components,
    };

    if (description) container.description = description;
    if (accentColor) container.accent_color = accentColor;

    return container;
  }

  static createSection({ components = [] }) {
    return {
      type: ComponentType.Section,
      components: components,
    };
  }

  static createTextDisplay(content) {
    return {
      type: ComponentType.TextDisplay,
      content: content,
    };
  }

  static createLabel(content) {
    return {
      type: ComponentType.Label,
      content: content,
    };
  }

  static createSeparator() {
    return {
      type: ComponentType.Separator,
    };
  }

  static createThumbnail({ src, size = null }) {
    const thumbnail = {
      type: ComponentType.Thumbnail,
      src: src,
    };

    if (size) thumbnail.size = size;

    return thumbnail;
  }

  static createMediaGallery({ items = [] }) {
    return {
      type: ComponentType.MediaGallery,
      items: items,
    };
  }

  static createActionRow(components = []) {
    return {
      type: ComponentType.ActionRow,
      components: components,
    };
  }

  static createButton({ customId, label, style, emoji, url, disabled }) {
    const button = {
      type: ComponentType.Button,
      style: style,
      label: label,
      disabled: disabled,
    };

    if (customId) button.custom_id = customId;
    if (emoji) button.emoji = emoji;
    if (url) button.url = url;

    return button;
  }

  static buildV2Message({ titleTextDisplay, description, markdownContent, textDisplays = [], labels = [], thumbnail = null, mediaGallery = null, buttons = [], separator = false, components = [], accentColor = 0x5865F2, content = null }) {
    const containerComponents = [];
    
    // Support for both boolean and array of indices
    // If it's an array, we use it for specific placements and disable automatic separator
    // If it's a boolean, we use it for automatic separator logic
    const separatorIndices = Array.isArray(separator) ? separator : null;
    const isSeparatorEnabled = separator === true;

    // Add title as text display if provided
    if (titleTextDisplay) {
      containerComponents.push(this.createTextDisplay("# " + titleTextDisplay));
    }

    // Add text displays from the new array
    if (Array.isArray(textDisplays)) {
      textDisplays.forEach((text, index) => {
        if (text) {
          containerComponents.push(this.createTextDisplay(text));
          if (separatorIndices && separatorIndices.includes(index)) {
            containerComponents.push(this.createSeparator());
          }
        }
      });
    }

    // Add legacy text content
    if (markdownContent) {
      containerComponents.push(this.createTextDisplay(markdownContent));
    }

    // Add separator if requested or if we have a title/markdown and content following it
    // We only do the automatic separator if separator was not provided as an array
    const hasTitle = titleTextDisplay || markdownContent || (textDisplays.length > 0 && (separatorIndices === null || !separatorIndices.includes(textDisplays.length - 1)));
    const hasContent = description || components.length > 0 || buttons.length > 0 || labels.length > 0 || thumbnail || mediaGallery;
    if (isSeparatorEnabled || (separatorIndices === null && hasTitle && hasContent)) {
      containerComponents.push(this.createSeparator());
    }

    if (description) {
      containerComponents.push(this.createTextDisplay(description));
    }

    // Add labels
    if (Array.isArray(labels)) {
      labels.forEach(label => {
        if (label) {
          containerComponents.push(this.createLabel(label));
        }
      });
    }

    // Add thumbnail if provided
    if (thumbnail) {
      containerComponents.push(this.createThumbnail({ src: thumbnail }));
    }

    // Add media gallery if provided
    if (mediaGallery && mediaGallery.length > 0) {
      containerComponents.push(this.createMediaGallery({ items: mediaGallery }));
    }

    // Handle components (legacy and new buttons)
    const allButtons = [...buttons];
    const otherComponents = [];

    if (Array.isArray(components)) {
      components.forEach(comp => {
        if (comp.type === ComponentType.Button) {
          allButtons.push(comp);
        } else {
          otherComponents.push(comp);
        }
      });
    }

    otherComponents.forEach(comp => containerComponents.push(comp));

    if (allButtons.length > 0) {
      for (let i = 0; i < allButtons.length; i += 5) {
        containerComponents.push(this.createActionRow(allButtons.slice(i, i + 5)));
      }
    }

    const container = this.createContainer({
      accentColor: accentColor,
      components: containerComponents,
    });

    return {
      content: content,
      flags: 32768, // Required flag for v2 components
      components: [container]
    };
  }
}