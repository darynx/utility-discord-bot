import { Innertube } from 'youtubei.js';
import { createLogger } from './Logger.js';

export class YouTubeHelper {
  constructor() {
    this.youtube = null;
    this.initPromise = null;
    this.logger = createLogger('YouTubeHelper');
  }

  async init() {
    if (this.youtube) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.youtube = await Innertube.create();
        this.logger.info('YouTubeHelper initialized (youtubei.js)');
      } catch (error) {
        this.logger.error('Failed to initialize youtubei.js:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async getCommunityPosts(channelId) {
    try {
      await this.init();
      
      this.logger.debug(`Fetching community posts for channel: ${channelId}`);
      const channel = await this.youtube.getChannel(channelId);
      const community = await channel.getCommunity();
      
      if (!community || !community.posts) {
        return [];
      }

      // Map youtubei.js posts to a common format
      // Note: community.posts is an array of Post objects
      return community.posts.map(post => {
        // Different post types (BackstagePost, SharedPost, etc.)
        // We'll try to extract common fields
        
        const postId = post.id;
        const author = post.author?.name || '';
        const authorId = post.author?.id || channelId;
        const publishedTime = post.published || '';
        
        // Content is usually in post.content (Text)
        let description = '';
        if (post.content) {
          description = post.content.toString();
        }

        // Try to extract the actual publishedAt timestamp from the post
        // youtubei.js posts may have different timestamp formats
        let publishedAt = new Date().toISOString(); // fallback

        if (post.published) {
          if (post.published instanceof Date) {
            publishedAt = post.published.toISOString();
          } else if (typeof post.published === 'number') {
            publishedAt = new Date(post.published * 1000).toISOString();
          }
        }

        // Check for timestamp property (unix timestamp in seconds)
        if (post.timestamp && typeof post.timestamp === 'number') {
          publishedAt = new Date(post.timestamp * 1000).toISOString();
        }

        return {
          id: postId,
          snippet: {
            channelId: authorId,
            channelTitle: author,
            description: description,
            publishedAt: publishedAt,
            type: 'bulletin'
          }
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching community posts for ${channelId}:`, error.message);
      return [];
    }
  }
}