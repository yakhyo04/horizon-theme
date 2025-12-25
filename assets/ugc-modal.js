import { UGCComponent } from './ugc-component.js';

/**
 * @typedef {import('./ugc-component.js').UGCPost} UGCPost
 */

/**
 * @typedef {Object} UGCModalRefs
 * @property {Element} slideshowContainer - Container for the slideshow
 */

/**
 * UGC Modal Component
 *
 * Displays user-generated content in a lightbox modal with slideshow
 * @extends {UGCComponent<UGCModalRefs>}
 */
class UGCModalComponent extends UGCComponent {
  /** @type {UGCPost[]} */
  posts = [];

  /** @type {number} */
  currentIndex = 0;

  /** @type {HTMLElement|null} */
  slideshowComponent = null;

  /** @type {HTMLElement|null} */
  dialogComponent = null;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('ugc:open-modal', this.handleOpenModal.bind(this));
  }

  /**
   * Handle open modal event from gallery
   * @param {CustomEvent<{post: UGCPost, index: number, posts: UGCPost[]}>} event
   */
  handleOpenModal(event) {
    const { posts, index } = event.detail;
    this.posts = posts;
    this.currentIndex = index;
    this.renderSlideshow();
    
    const dialogComponent = document.getElementById('ugc-modal');
    if (dialogComponent && 'showDialog' in dialogComponent) {
      dialogComponent.showDialog();
    }
  }

  renderSlideshow() {
    const container = /** @type {Element} */ (this.refs.slideshowContainer);
    if (!container || this.posts.length === 0) return;

    // Get the slideshow template
    const slideshowTemplate = /** @type {HTMLTemplateElement} */ (document.getElementById('ugc-modal-slideshow-template'));
    if (!slideshowTemplate) return;

    // Clear container and clone template
    container.innerHTML = '';
    const slideshowEl = /** @type {HTMLElement} */ (slideshowTemplate.content.cloneNode(true).querySelector('slideshow-component'));
    if (!slideshowEl) return;

    // Set timeline scope and initial slide
    const timelineScope = this.posts.map((_, i) => `--slide-${i}`).join(', ');
    slideshowEl.style.setProperty('--slideshow-timeline', timelineScope);
    slideshowEl.setAttribute('initial-slide', String(this.currentIndex));
    
    // Find slides container and add slides
    const slidesContainer = slideshowEl.querySelector('slideshow-slides');
    if (slidesContainer) {
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < this.posts.length; i++) {
        const slide = this.renderSlide(this.posts[i], i);
        if (slide) fragment.appendChild(slide);
      }
      
      slidesContainer.appendChild(fragment);
    }
    
    // Append slideshow to container - this triggers connectedCallback with slides already present
    container.appendChild(slideshowEl);
  }

  /**
   * Render a single modal slide with full card content
   * @param {UGCPost} post - Post data
   * @param {number} index - Slide index
   * @returns {HTMLElement|null}
   */
  renderSlide(post, index) {
    const template = /** @type {HTMLTemplateElement} */ (document.getElementById('ugc-modal-slide-template'));
    if (!template) return null;

    const slide = /** @type {HTMLElement} */ (template.content.cloneNode(true).querySelector('slideshow-slide'));
    
    slide.setAttribute('aria-hidden', 'true');
    slide.style.setProperty('--slideshow-timeline', `--slide-${index}`);
    slide.setAttribute('slide-id', `ugc-modal-slide-${index}`);
    
    // Media
    const img = /** @type {HTMLImageElement} */ (slide.querySelector('.ugc-modal__image'));
    if (img) {
      img.src = post.originalImageUrl || post.imageUrl;
      img.alt = `User generated content from ${post.source}`;
    }
    
    // User info
    const avatar = slide.querySelector('.ugc-modal__avatar-letter');
    if (avatar) avatar.textContent = post.userInitial || 'U';
    
    const username = slide.querySelector('.ugc-modal__username');
    if (username) username.textContent = post.username || 'Instagram User';
    
    const date = slide.querySelector('.ugc-modal__date');
    if (date) date.textContent = post.date || '';
    
    const source = slide.querySelector('.ugc-modal__source');
    if (source) source.innerHTML = this.getSourceIcon(post.source);
    
    // Products
    const productsContainer = slide.querySelector('.ugc-modal__products');
    if (productsContainer && post.products && post.products.length > 0) {
      productsContainer.innerHTML = post.products.map(product => `
        <a href="${product.url}" class="ugc-modal__product" target="_blank" rel="noopener">
          ${product.imageUrl ? `<img class="ugc-modal__product-image" src="${product.imageUrl}" alt="${product.name}" loading="lazy" />` : ''}
          <div class="ugc-modal__product-info">
            ${product.rating ? `
              <div class="ugc-modal__product-rating">
                ${this.renderStars(product.rating)}
                <span>${product.rating.toFixed(1)}</span>
              </div>
            ` : ''}
            <span class="ugc-modal__product-name">${product.name}</span>
          </div>
        </a>
      `).join('');
    } else if (productsContainer) {
      productsContainer.remove();
    }
    
    // Caption
    const caption = slide.querySelector('.ugc-modal__caption');
    if (caption) caption.innerHTML = post.content || '';
    
    // Engagement
    const upvoteSpan = slide.querySelector('.ugc-modal__vote--up span');
    if (upvoteSpan) upvoteSpan.textContent = String(post.upvotes || 0);
    
    const downvoteSpan = slide.querySelector('.ugc-modal__vote--down span');
    if (downvoteSpan) downvoteSpan.textContent = String(post.downvotes || 0);
    
    return slide;
  }

  /**
   * Render star rating
   * @param {number} rating - Rating value (0-5)
   * @returns {string}
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += `<svg class="ugc-modal__star ugc-modal__star--full" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
      </svg>`;
    }

    if (hasHalfStar) {
      stars += `<svg class="ugc-modal__star ugc-modal__star--half" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
      </svg>`;
    }

    for (let i = 0; i < emptyStars; i++) {
      stars += `<svg class="ugc-modal__star ugc-modal__star--empty" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z"/>
      </svg>`;
    }

    return stars;
  }
}

if (!customElements.get('ugc-modal-component')) {
  customElements.define('ugc-modal-component', UGCModalComponent);
}

export { UGCModalComponent };
