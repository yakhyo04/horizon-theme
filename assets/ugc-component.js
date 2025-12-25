import { Component } from '@theme/component';

/**
 * @typedef {Object} UGCProduct
 * @property {string} name - Product name
 * @property {string} url - Product URL
 * @property {string} imageUrl - Product image URL
 * @property {number} [rating] - Product rating
 */

/**
 * @typedef {Object} UGCPost
 * @property {string} id - Unique identifier for the post
 * @property {string} externalId - External image ID
 * @property {string} imageUrl - URL of the post image (low resolution)
 * @property {string} originalImageUrl - URL of the post image (high resolution)
 * @property {string} mediaType - Type of media ('image' or 'video')
 * @property {string} [videoEntryId] - Video entry ID for video posts
 * @property {string} [videoThumbnailUrl] - Video thumbnail URL
 * @property {string} source - Source platform (e.g., 'instagram')
 * @property {string} [username] - Username of the poster
 * @property {string} [userInitial] - First letter of username
 * @property {string} [date] - Post date
 * @property {string} [content] - Post caption/text
 * @property {number} [upvotes] - Number of upvotes
 * @property {number} [downvotes] - Number of downvotes
 * @property {UGCProduct[]} [products] - Tagged products
 */

const YOTPO_BATCH_API = 'https://staticw2.yotpo.com/batch';

/**
 * @typedef {{ [key: string]: Element | Element[] }} UGCRefs
 */

/**
 * Base UGC Component
 *
 * Provides shared functionality for UGC gallery and modal components
 * @template {UGCRefs} [T=UGCRefs]
 * @extends {Component<T>}
 */
class UGCComponent extends Component {
  static YOTPO_BATCH_API = YOTPO_BATCH_API;

  /** @type {Record<string, string>} */
  static sourceIcons = {
    instagram: `<svg class="ugc-card__source-icon" viewBox="0 0 24 24" width="16" height="16" role="img" aria-label="Instagram">
      <path fill="currentColor" d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/>
    </svg>`,
  };

  get appKey() {
    return this.getAttribute('app-key') || '';
  }

  get galleryId() {
    return this.getAttribute('gallery-id') || '';
  }

  get domainKey() {
    return this.getAttribute('domain-key') || '';
  }

  /**
   * Get SVG icon for source platform
   * @param {string} source - Source platform name
   * @returns {string} SVG markup
   */
  getSourceIcon(source) {
    return UGCComponent.sourceIcons[source] || '';
  }

  /**
   * Make API request to Yotpo batch endpoint
   * @param {Object} payload - Request payload
   * @returns {Promise<Array<{method?: string, result?: string}>>}
   */
  async fetchFromYotpo(payload) {
    const response = await fetch(YOTPO_BATCH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Normalize URL to include protocol
   * @param {string} url - URL to normalize
   * @returns {string}
   */
  normalizeUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https:${url}`;
  }
}

export { UGCComponent, YOTPO_BATCH_API };
