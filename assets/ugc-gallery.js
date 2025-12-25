import { UGCComponent, YOTPO_BATCH_API } from './ugc-component.js';

/**
 * @typedef {import('./ugc-component.js').UGCPost} UGCPost
 */

/**
 * @typedef {{ container: Element, slideshowContainer?: Element }} UGCGalleryRefs
 */

/**
 * UGC Gallery Component
 *
 * Fetches and displays user-generated content images from Yotpo API
 * Supports both grid and carousel layouts
 * @extends {UGCComponent<UGCGalleryRefs>}
 */
class UGCGalleryComponent extends UGCComponent {
  /** @type {UGCPost[]} */
  posts = [];

  /** @type {boolean} */
  isLoading = false;

  /** @type {boolean} */
  hasError = false;

  /** @type {HTMLElement|null} */
  slideshowComponent = null;

  connectedCallback() {
    super.connectedCallback();
    this.fetchUGCData();
  }

  get maxItems() {
    return parseInt(this.getAttribute('max-items') || '12', 10);
  }

  get columns() {
    return parseInt(this.getAttribute('columns') || '5', 10);
  }

  get rows() {
    return parseInt(this.getAttribute('rows') || '2', 10);
  }

  get layoutType() {
    return this.getAttribute('layout-type') || 'grid';
  }

  get isCarousel() {
    return this.layoutType === 'carousel';
  }

  get displayScrollbar() {
    return this.getAttribute('display-scrollbar') === 'true';
  }

  get sectionWidth() {
    return this.getAttribute('section-width') || 'page-width';
  }

  get partialGalleryApiUrl() {
    return `${YOTPO_BATCH_API}/app_key/${this.appKey}/domain_key/${this.domainKey}/widget/partial_generic_gallery`;
  }

  /**
   * Build the Yotpo API payload for the partial_generic_gallery method
   * @returns {Object}
   */
  buildGalleryPayload() {
    const perPage = this.columns * this.rows;

    return {
      methods: [
        {
          method: 'partial_generic_gallery',
          params: {
            demo: false,
            widget_ref_name: 'picture_gallery_shop_now',
            widget_name: 'pictures-gallery',
            images_per_row: this.columns,
            rows: this.rows,
            total_number_of_images: this.maxItems,
            gallery_id: this.galleryId,
            per_page: perPage,
            gid: this.galleryId,
            page: 1,
            max_images_in_view: this.columns,
            element_width: 100,
            div_settings: {},
          },
        },
      ],
      app_key: this.appKey,
      is_mobile: String(window.innerWidth < 750),
    };
  }

  async fetchUGCData() {
    if (!this.appKey || !this.galleryId) {
      this.renderEmptyState('No API key or gallery ID configured');
      return;
    }

    this.isLoading = true;
    this.renderLoadingState();

    try {
      const payload = this.buildGalleryPayload();

      const response = await fetch(this.partialGalleryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.posts = this.parseGalleryResponse(data);
      this.renderPosts();
    } catch (error) {
      console.error('Failed to fetch UGC data:', error);
      this.hasError = true;
      this.renderEmptyState('Failed to load content');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse Yotpo partial_generic_gallery API response
   * Extracts both images and lightbox content
   * @param {Array<{method?: string, result?: string}>} response - Raw API response
   * @returns {UGCPost[]}
   */
  parseGalleryResponse(response) {
    /** @type {UGCPost[]} */
    const posts = [];

    if (!Array.isArray(response)) {
      return posts;
    }

    for (const item of response) {
      if (item.method !== 'partial_pictures_gallery' || !item.result) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(item.result, 'text/html');

      const imageContainers = doc.querySelectorAll('.yotpo-single-image-container');
      const lightboxContents = doc.querySelector('.yotpo-lightbox-contents');

      for (const container of imageContainers) {
        const post = this.parseImageContainer(container, lightboxContents);
        if (post) {
          posts.push(post);
        }
      }
    }

    return posts.slice(0, this.maxItems);
  }

  /**
   * Parse individual image container element with its lightbox content
   * @param {Element} container - Image container element
   * @param {Element|null} lightboxContents - Lightbox contents container
   * @returns {UGCPost|null}
   */
  parseImageContainer(container, lightboxContents) {
    const overlay = container.querySelector('.y-image-overlay');
    if (!overlay) return null;

    const id = overlay.getAttribute('data-image-id') || '';
    const externalId = overlay.getAttribute('data-external-image-id') || '';
    const source = overlay.getAttribute('data-source') || 'instagram';
    const mediaType = overlay.getAttribute('data-media-type') || 'image';

    let imageUrl = '';
    let originalImageUrl = '';
    let videoEntryId = '';
    let videoThumbnailUrl = '';

    if (mediaType === 'video') {
      const videoEl = container.querySelector('.yotpo-video');
      videoEntryId = videoEl?.getAttribute('data-entry-id') || overlay.getAttribute('data-entry-id') || '';
      videoThumbnailUrl = videoEl?.getAttribute('data-src-url') || '';
      videoThumbnailUrl = this.normalizeUrl(videoThumbnailUrl);
      imageUrl = videoThumbnailUrl;
      originalImageUrl = videoThumbnailUrl;
    } else {
      const imgEl = container.querySelector('.yotpo-image');
      imageUrl = this.normalizeUrl(imgEl?.getAttribute('data-src') || '');
      originalImageUrl = this.normalizeUrl(overlay.getAttribute('data-original-src') || imageUrl);
    }

    if (!imageUrl && !videoThumbnailUrl) return null;

    let username = '';
    let userInitial = '';
    let date = '';
    let content = '';
    let upvotes = 0;
    let downvotes = 0;
    /** @type {Array<{name: string, url: string, imageUrl: string, rating?: number}>} */
    let products = [];

    if (lightboxContents) {
      const sliderContent = lightboxContents.querySelector(`.yotpo-slider-content-${id}`);
      if (sliderContent) {
        const usernameEl = sliderContent.querySelector('.yotpo-instagram-username');
        username = usernameEl?.textContent?.trim() || '';
        userInitial = username.charAt(0).toUpperCase() || 'U';

        const dateEl = sliderContent.querySelector('.yotpo-review-date');
        date = dateEl?.textContent?.trim() || '';

        const contentEl = sliderContent.querySelector('.yopto-main');
        content = this.cleanContent(contentEl?.innerHTML || '');

        const upvoteEl = sliderContent.querySelector('[data-type="up"] + .vote-sum');
        const downvoteEl = sliderContent.querySelector('[data-type="down"] + .vote-sum');
        upvotes = parseInt(upvoteEl?.textContent?.trim() || '0', 10);
        downvotes = parseInt(downvoteEl?.textContent?.trim() || '0', 10);

        const productContainer = sliderContent.querySelector('.yotpo-lightbox-products-container');
        if (productContainer) {
          const productEls = productContainer.querySelectorAll('.yotpo-lightbox-product');
          for (const productEl of productEls) {
            const productLink = productEl.querySelector('a[href]');
            const productName = productEl.querySelector('.yotpo-lightbox-product-name');
            const productImg = productEl.querySelector('.yotpo-lightbox-product-main-image');
            const ratingEl = productEl.querySelector('.score-title');

            if (productLink && productName) {
              products.push({
                name: productName.textContent?.trim() || '',
                url: productLink.getAttribute('href') || '',
                imageUrl: productImg?.getAttribute('data-src') || '',
                rating: ratingEl ? parseFloat(ratingEl.textContent || '0') : undefined,
              });
            }
          }
        }
      }
    }

    return {
      id,
      externalId,
      imageUrl,
      originalImageUrl,
      mediaType,
      videoEntryId,
      videoThumbnailUrl,
      source,
      username,
      userInitial,
      date,
      content,
      upvotes,
      downvotes,
      products,
    };
  }

  /**
   * Clean HTML content from Yotpo markup
   * @param {string} content - Raw HTML content
   * @returns {string}
   */
  cleanContent(content) {
    return content
      .replace(/<span class="yotpo-instagram-hashtag">([^<]+)<\/span>/g, '<span class="ugc-hashtag">$1</span>')
      .replace(/\n/g, '<br>')
      .replace(/@(\w+)/g, '<span class="ugc-mention">@$1</span>')
      .trim();
  }

  renderLoadingState() {
    const container = /** @type {Element} */ (this.refs.container);
    if (!container) return;

    const skeletonCount = Math.min(this.maxItems, this.columns * this.rows);
    const skeletons = Array(skeletonCount)
      .fill(0)
      .map(
        () => `
          <div class="ugc-card ugc-card--skeleton resource-list__item">
            <div class="ugc-card__image-skeleton"></div>
          </div>
        `
      )
      .join('');

    container.innerHTML = skeletons;
  }

  /**
   * Render empty state message
   * @param {string} message - Message to display
   */
  renderEmptyState(message) {
    const container = /** @type {Element} */ (this.refs.container);
    if (!container) return;

    container.innerHTML = `
      <div class="ugc-gallery__empty">
        <p>${message}</p>
      </div>
    `;
  }

  renderPosts() {
    const container = /** @type {Element} */ (this.refs.container);
    if (!container) return;

    if (this.posts.length === 0) {
      this.renderEmptyState('No posts available');
      return;
    }

    if (this.isCarousel) {
      this.renderCarousel(container);
    } else {
      this.renderGrid(container);
    }

    container.addEventListener('click', this.handleCardClick.bind(this));

    this.dispatchEvent(
      new CustomEvent('ugc:loaded', {
        bubbles: true,
        detail: { count: this.posts.length, posts: this.posts },
      })
    );
  }

  /**
   * Render card HTML for a single post using template
   * @param {UGCPost} post - Post data
   * @param {number} index - Post index
   * @returns {HTMLElement}
   */
  renderCard(post, index) {
    const templateId = post.mediaType === 'video' ? 'ugc-card-video-template' : 'ugc-card-template';
    const template = /** @type {HTMLTemplateElement} */ (document.getElementById(templateId));
    if (!template) return null;

    const card = /** @type {HTMLElement} */ (template.content.cloneNode(true).querySelector('.ugc-card'));
    
    card.setAttribute('data-post-id', post.id);
    card.setAttribute('data-post-index', String(index));
    card.setAttribute('aria-label', `View post ${index + 1} from ${post.source}`);
    
    const img = /** @type {HTMLImageElement} */ (card.querySelector('.ugc-card__image'));
    if (img) {
      img.src = post.imageUrl;
      img.alt = `User generated content from ${post.source}`;
      if (post.mediaType !== 'video') {
        img.setAttribute('data-src-hd', post.originalImageUrl);
      }
    }
    
    const sourceBadge = card.querySelector('.ugc-card__source-badge');
    if (sourceBadge) {
      sourceBadge.innerHTML = this.getSourceIcon(post.source);
    }
    
    return card;
  }

  /**
   * Render posts in grid layout
   * @param {Element} container - Container element
   */
  renderGrid(container) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < this.posts.length; i++) {
      const card = this.renderCard(this.posts[i], i);
      if (card) fragment.appendChild(card);
    }
    
    container.appendChild(fragment);
  }

  /**
   * Render posts in carousel layout using slideshow component
   * @param {Element} container - Container element
   */
  renderCarousel(container) {
    const timelineScope = this.posts.map((_, i) => `--slide-${i}`).join(', ');
    const gutterStyle =
      this.sectionWidth === 'page-width' ? '--gutter-slide-width: var(--util-page-margin-offset);' : '--gutter-slide-width: 0px;';
    const guttersAttr = this.sectionWidth === 'page-width' ? 'gutters="start end"' : '';

    // Create a temporary container to build the complete slideshow
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div class="resource-list__carousel" style="${gutterStyle} --slide-width-max: 300px;">
        <slideshow-component
          ref="ugcSlideshow"
          class="resource-list__carousel"
          style="--slideshow-timeline: ${timelineScope};"
          initial-slide="0"
        >
          <slideshow-container ref="slideshowContainer">
            <slideshow-arrows position="center">
              <button
                class="slideshow-control slideshow-control--previous button button-unstyled button-unstyled--transparent flip-x"
                aria-label="Previous"
                on:click="/previous"
                ref="previous"
              >
                <span class="svg-wrapper icon-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 6L8 12L14 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
              <button
                class="slideshow-control slideshow-control--next button button-unstyled button-unstyled--transparent"
                aria-label="Next"
                on:click="/next"
                ref="next"
              >
                <span class="svg-wrapper icon-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 6L8 12L14 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
            </slideshow-arrows>
            <slideshow-slides
              tabindex="-1"
              ref="scroller"
              ${guttersAttr}
            >
            </slideshow-slides>
            ${
              this.displayScrollbar
                ? `
              <slideshow-scroll-bar class="slideshow-scroll-bar">
                <div class="slideshow-scroll-bar__track" ref="track">
                  <div class="slideshow-scroll-bar__thumb" ref="thumb"></div>
                </div>
              </slideshow-scroll-bar>
            `
                : ''
            }
          </slideshow-container>
        </slideshow-component>
      </div>
    `;

    // Get the slideshow and slides container from the temp element
    const carouselWrapper = tempDiv.firstElementChild;
    const slidesContainer = tempDiv.querySelector('slideshow-slides');
    
    if (!carouselWrapper || !slidesContainer) return;

    // Add slides BEFORE inserting into DOM - this is critical!
    for (let i = 0; i < this.posts.length; i++) {
      const slide = document.createElement('slideshow-slide');
      slide.setAttribute('ref', 'slides[]');
      slide.classList.add('resource-list__slide');
      slide.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      slide.style.setProperty('--slideshow-timeline', `--slide-${i}`);
      slide.setAttribute('slide-id', `ugc-slide-${i}`);
        
      const card = this.renderCard(this.posts[i], i);
      if (card) slide.appendChild(card);
      
      slidesContainer.appendChild(slide);
    }

    // Now insert the complete carousel with slides into the DOM
    container.innerHTML = '';
    container.appendChild(carouselWrapper);
    
    this.slideshowComponent = container.querySelector('slideshow-component');
  }

  /**
   * Handle card click to open modal
   * @param {Event} event - Click event
   */
  handleCardClick(event) {
    const target = /** @type {Element|null} */ (event.target);
    const card = target?.closest('.ugc-card');
    if (!card) return;

    const postIndex = parseInt(card.getAttribute('data-post-index') || '0', 10);
    const post = this.posts[postIndex];

    if (post) {
      this.dispatchEvent(
        new CustomEvent('ugc:open-modal', {
          bubbles: true,
          detail: { post, index: postIndex, posts: this.posts },
        })
      );
    }
  }
}

if (!customElements.get('ugc-gallery-component')) {
  customElements.define('ugc-gallery-component', UGCGalleryComponent);
}

export { UGCGalleryComponent };
