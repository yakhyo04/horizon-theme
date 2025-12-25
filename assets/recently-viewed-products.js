import { sectionRenderer } from '@theme/section-renderer';

/**
 * Updates the recently viewed products in localStorage.
 */
export class RecentlyViewed {
  /** @static @constant {string} The key used to store the viewed products in session storage */
  static #STORAGE_KEY = 'viewedProducts';
  /** @static @constant {number} The maximum number of products to store */
  static #MAX_PRODUCTS = 10;

  /**
   * Adds a product to the recently viewed products list.
   * @param {string} productId - The ID of the product to add.
   */
  static addProduct(productId) {
    let viewedProducts = this.getProducts();

    viewedProducts = viewedProducts.filter((/** @type {string} */ id) => id !== productId);
    viewedProducts.unshift(productId);
    viewedProducts = viewedProducts.slice(0, this.#MAX_PRODUCTS);

    localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(viewedProducts));
  }

  static clearProducts() {
    localStorage.removeItem(this.#STORAGE_KEY);
  }

  /**
   * Retrieves the list of recently viewed products from session storage.
   * @returns {string[]} The list of viewed products.
   */
  static getProducts() {
    return JSON.parse(localStorage.getItem(this.#STORAGE_KEY) || '[]');
  }
}

/**
 * Recently Viewed Products web component
 * Fetches and displays recently viewed products using the Search API
 */
class RecentlyViewedProducts extends HTMLElement {
  /**
   * The observer for lazy loading
   * @type {IntersectionObserver | null}
   */
  #intersectionObserver = null;

  /**
   * The element being observed for intersection
   * @type {Element | null}
   */
  #observedElement = null;

  /**
   * An abort controller for the active fetch (if there is one)
   * @type {AbortController | null}
   */
  #activeFetch = null;

  /**
   * Whether the products have been loaded
   * @type {boolean}
   */
  #loaded = false;

  connectedCallback() {
    this.#setupObserver();
  }

  disconnectedCallback() {
    this.#intersectionObserver?.disconnect();
    this.#activeFetch?.abort();
  }

  /**
   * Setup the intersection observer
   * If inside a tab panel, observe the parent tabs-component instead
   * to preload content before the tab is clicked
   */
  #setupObserver() {
    this.#intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0]?.isIntersecting) return;

        observer.disconnect();
        this.#loadRecentlyViewed();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );

    const tabPanel = this.closest('tab-panel');
    if (tabPanel) {
      this.#observedElement = tabPanel.closest('tabs-component') || tabPanel;
    } else {
      this.#observedElement = this;
    }

    this.#intersectionObserver.observe(this.#observedElement);
  }

  /**
   * Load the recently viewed products
   */
  async #loadRecentlyViewed() {
    if (this.#loaded) return;

    const viewedProducts = RecentlyViewed.getProducts();
    
    if (viewedProducts.length === 0) {
      this.#handleEmpty();
      return;
    }

    const { sectionId, maxProducts } = this.dataset;
    const id = this.id;

    if (!sectionId || !id) {
      this.#handleError(new Error('Section ID and component ID are required'));
      return;
    }

    try {
      const markup = await this.#fetchRecentlyViewedMarkup(viewedProducts, sectionId, maxProducts);
      
      if (!markup) {
        this.#handleEmpty();
        return;
      }

      const html = document.createElement('div');
      html.innerHTML = markup;
      const recentlyViewed = html.querySelector(`recently-viewed-products[id="${id}"]`);

      if (recentlyViewed?.innerHTML && recentlyViewed.innerHTML.trim().length) {
        this.#loaded = true;
        this.innerHTML = recentlyViewed.innerHTML;
      } else {
        this.#handleEmpty();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.#handleError(error);
      }
    }
  }

  /**
   * Fetch recently viewed products markup using Search API
   * @param {string[]} productIds - Array of product IDs
   * @param {string} sectionId - The section ID for rendering
   * @param {string | undefined} maxProducts - Maximum number of products to show
   * @returns {Promise<string | null>}
   */
  async #fetchRecentlyViewedMarkup(productIds, sectionId, maxProducts) {
    const limit = parseInt(maxProducts || '4', 10);
    const limitedIds = productIds.slice(0, limit);
    
    if (limitedIds.length === 0) return null;

    this.#activeFetch?.abort();
    this.#activeFetch = new AbortController();

    const url = new URL(Theme.routes.search_url, location.origin);
    url.searchParams.set('q', limitedIds.map((id) => `id:${id}`).join(' OR '));
    url.searchParams.set('resources[type]', 'product');

    try {
      const markup = await sectionRenderer.getSectionHTML(sectionId, false, url);
      
      if (this.#activeFetch?.signal.aborted) {
        return null;
      }
      
      return markup;
    } finally {
      this.#activeFetch = null;
    }
  }

  /**
   * Handle empty state (no recently viewed products)
   */
  #handleEmpty() {
    this.classList.add('hidden');
    this.dataset.hasProducts = 'false';
  }

  /**
   * Handle errors in a consistent way
   * @param {Error} error
   */
  #handleError(error) {
    console.error('Recently viewed products error:', error.message);
    this.classList.add('hidden');
    this.dataset.error = 'Error loading recently viewed products';
  }
}

if (!customElements.get('recently-viewed-products')) {
  customElements.define('recently-viewed-products', RecentlyViewedProducts);
}
