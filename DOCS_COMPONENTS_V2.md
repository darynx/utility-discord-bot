# Discord Components v2 & Layout Components

Discord Components v2 (IS_COMPONENTS_V2 flag=32768) introduce new layout components like Containers, Sections, Text Displays, and Separators. These allow for richer message formatting beyond traditional embeds. Since `discord.js` v14 doesn't fully support these yet, we use a raw API helper and a custom `ComponentBuilder` to send these components.

## Core Concepts

### IS_COMPONENTS_V2 Flag
To use v2 components, the message payload must include the `flags` field set to `32768`. This tells Discord to process the new component types.

### Component Types
| Type | Name | Number | Description |
|------|------|--------|-------------|
| 1 | ActionRow | 1 | A row that can contain other components (Buttons, Select Menus). |
| 2 | Button | 2 | A clickable button. |
| 3 | StringSelect | 3 | A select menu for strings. |
| 4 | TextInput | 4 | A text input field (used in modals). |
| 5 | UserSelect | 5 | A select menu for users. |
| 6 | RoleSelect | 6 | A select menu for roles. |
| 7 | MentionableSelect | 7 | A select menu for users and roles. |
| 8 | ChannelSelect | 8 | A select menu for channels. |
| 9 | Section | 9 | A logical section within a container to group components. |
| 10 | TextDisplay | 10 | A component for displaying text with support for markdown. |
| 13 | File | 13 | A downloadable file attachment. |
| 14 | Separator | 14 | A horizontal line separator used to divide content. |
| 15 | Form | 15 | A structured form within a component. |
| 16 | Inputs | 16 | A group of input fields. |
| 17 | Container | 17 | The top-level component that wraps all other layout components. Supports an accent color. |
| 18 | Label | 18 | A small text label, often used for categorization or status. |
| 24 | Thumbnail | 24 | A small image displayed within a component (v2). |
| 25 | MediaGallery | 25 | A gallery of images or videos (v2). |

## DiscordApiHelper

The `DiscordApiHelper` provides direct access to Discord's REST API using `fetch()` to send payloads that `discord.js` might not yet support.

### Usage

```javascript
// Send a message with v2 components
const payload = ComponentBuilder.buildV2Message({
  titleTextDisplay: 'My V2 Message',
  description: 'This uses a Container component!',
  accentColor: 0x5865F2
});

await client.apiHelper.sendMessage(channelId, payload);
```

## ComponentBuilder V2

The `ComponentBuilder` utility makes it easy to construct these complex nested objects.

### Basic Container with Title
```javascript
const container = ComponentBuilder.createContainer({
  accentColor: 0x5865F2,
  components: [
    ComponentBuilder.createTextDisplay('# This is a Title')
  ]
});
```

### Multiple TextDisplays
```javascript
const container = ComponentBuilder.createContainer({
  components: [
    ComponentBuilder.createTextDisplay('First paragraph of text.'),
    ComponentBuilder.createTextDisplay('Second paragraph with **bold** text.')
  ]
});
```

### Separators
Separators can be placed between any components to provide visual distinction.
```javascript
const container = ComponentBuilder.createContainer({
  components: [
    ComponentBuilder.createTextDisplay('Content Above'),
    ComponentBuilder.createSeparator(),
    ComponentBuilder.createTextDisplay('Content Below')
  ]
});
```

### Labels
Labels are small text indicators useful for showing status or category (Type 18).
```javascript
const container = ComponentBuilder.createContainer({
  components: [
    ComponentBuilder.createTextDisplay('Server Status'),
    ComponentBuilder.createLabel('ONLINE'),
    ComponentBuilder.createLabel('BETA')
  ]
});
```

### Buttons in ActionRow
Buttons must still be wrapped in an `ActionRow`.
```javascript
const actionRow = ComponentBuilder.createActionRow([
  ComponentBuilder.createButton({ customId: 'primary_btn', label: 'Click Me', style: 1 }),
  ComponentBuilder.createButton({ url: 'https://google.com', label: 'Google', style: 5 })
]);

const container = ComponentBuilder.createContainer({
  components: [
    ComponentBuilder.createTextDisplay('Check out these buttons:'),
    actionRow
  ]
});
```

## Media Components

V2 introduces dedicated media components that can be embedded directly within a Container.

### Thumbnail (Type 24)
The Thumbnail component displays a small image within a v2 message. Unlike the embed `thumbnail` field, this is a layout component that appears inline with other components.

```javascript
const thumbnail = ComponentBuilder.createThumbnail({
  src: 'https://example.com/image.png',
  size: 64 // Optional: specify size in pixels
});
```

### MediaGallery (Type 25)
The MediaGallery component displays a collection of images or videos in a gallery layout.

```javascript
const gallery = ComponentBuilder.createMediaGallery({
  items: [
    { src: 'https://example.com/image1.png' },
    { src: 'https://example.com/image2.png' }
  ]
});
```

### Full Example with Media Components
```javascript
const payload = ComponentBuilder.buildV2Message({
  titleTextDisplay: 'Media Showcase',
  textDisplays: [
    'Check out these images!'
  ],
  labels: ['GALLERY', 'FEATURED'],
  thumbnail: 'https://example.com/thumbnail.png',
  mediaGallery: [
    { src: 'https://example.com/photo1.png' },
    { src: 'https://example.com/photo2.png' }
  ],
  separator: true,
  accentColor: 0x5865F2
});
```

## Full "Embed-Like" Message Example
```javascript
const payload = ComponentBuilder.buildV2Message({
  titleTextDisplay: 'Server Status',
  textDisplays: [
    '🟢 **Online**',
    'Players: 10/100',
    'Uptime: 24h'
  ],
  labels: ['ACTIVE', 'BETA'],
  separator: [0, 2], // Separator after 1st and 3rd text display
  buttons: [
    { customId: 'refresh', label: 'Refresh', style: 1 }
  ],
  accentColor: 0x00FF00
});
```

## Limitations & Rules

1. **No Embeds**: You cannot use `embeds` in the same message as v2 components.
2. **No Content Field (usually)**: When using v2 components, the top-level `content` field is often restricted or should be left null if you want the container to be the primary focus.
3. **Container required**: v2 layout components (TextDisplay, Section, Label, Thumbnail, MediaGallery, etc.) MUST be inside a `Container` (Type 17).
4. **Flag required**: Don't forget `flags: 32768`.

## Troubleshooting

### Error: "MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2"
This error occurs when you try to send a message that contains both v2 components and legacy fields like `embeds`. 
**Solution**: Remove the `embeds` array from your payload. Use `TextDisplay` components within a `Container` to recreate the look of an embed.

### Components not showing
- Ensure `flags: 32768` is present at the top level of the payload.
- Ensure all layout components are wrapped in a `Container` (type 17).
- Check that your bot has the necessary permissions to send messages and embed links.