import { Component } from '@theme/component';

/**
 * TabPanel component - handles its own show/hide animations with GSAP
 * Uses position-based hiding instead of display:none to prevent layout shifts
 */
export class TabPanel extends HTMLElement {
  constructor() {
    super();

    /** @type {number} */
    this.duration = 0.8;

    /** @type {number} */
    this.stagger = 0.08;

    /** @type {string} */
    this.ease = 'power3.inOut';

    /** @type {string} */
    this.animateSelector = '.card';

    /** @type {GSAPTimeline | null} */
    this.timeline = null;
  }

  connectedCallback() {
    const durationAttr = this.getAttribute('duration');
    const staggerAttr = this.getAttribute('stagger');

    this.duration = durationAttr ? parseInt(durationAttr, 10) / 1000 : 0.8;
    this.stagger = staggerAttr ? parseInt(staggerAttr, 10) / 1000 : 0.05;
    this.animateSelector = this.getAttribute('animate-selector') || '.card';
    this.ease = this.getAttribute('ease') || 'power3.inOut';
  }

  /**
   * Get animatable elements
   * @returns {Element[]}
   */
  getTargets() {
    return Array.from(this.querySelectorAll(this.animateSelector || '.card'));
  }

  /**
   * Show panel with GSAP animation
   * @param {Function} [onComplete] - Callback when animation completes
   */
  show(onComplete) {
    if (this.timeline) {
      this.timeline.kill();
    }

    const targets = this.getTargets();

    // Position absolutely ON TOP during animation
    // This prevents stacking with the old panel
    gsap.set(this, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 2,
      visibility: 'visible',
      opacity: 1,
      pointerEvents: 'auto'
    });

    gsap.set(targets, { opacity: 0 });

    this.removeAttribute('hidden');
    this.setAttribute('aria-hidden', 'false');

    this.timeline = gsap.timeline({
      onComplete: () => {
        // Return to normal flow after animation
        gsap.set(this, {
          clearProps: 'position,top,left,width,zIndex,visibility,opacity,pointerEvents'
        });
        gsap.set(targets, { clearProps: 'opacity' });
        this.timeline = null;
        if (onComplete) onComplete();
      }
    });

    this.timeline.to(targets, {
      opacity: 1,
      duration: this.duration,
      stagger: this.stagger,
      ease: this.ease
    });
  }

  /**
   * Hide panel with GSAP animation
   * @param {Function} [onComplete] - Callback when animation completes
   */
  hide(onComplete) {
    if (this.timeline) {
      this.timeline.kill();
    }

    const targets = this.getTargets();

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.setAttribute('hidden', '');
        this.setAttribute('aria-hidden', 'true');
        gsap.set(targets, { clearProps: 'opacity' });
        this.timeline = null;
        if (onComplete) onComplete();
      }
    });

    this.timeline.to(targets, {
      opacity: 0,
      duration: this.duration,
      stagger: this.stagger,
      ease: this.ease
    });
  }

  /**
   * Show panel instantly without animation
   */
  showInstant() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    this.removeAttribute('hidden');
    this.setAttribute('aria-hidden', 'false');

    const targets = this.getTargets();
    gsap.set(targets, { clearProps: 'opacity' });
  }

  /**
   * Hide panel instantly without animation
   */
  hideInstant() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    this.setAttribute('hidden', '');
    this.setAttribute('aria-hidden', 'true');

    const targets = this.getTargets();
    gsap.set(targets, { clearProps: 'opacity' });
  }
}

customElements.define('tab-panel', TabPanel);

/**
 * @typedef {Object} TabsRefs
 * @property {Element[]} tabButtons
 * @property {TabPanel[]} tabPanels
 */

/**
 * Tabs component for managing tabbed interfaces
 * @extends {Component<TabsRefs>}
 */
export class Tabs extends Component {
  /**
   * Flag to prevent multiple simultaneous animations
   * @type {boolean}
   */
  isAnimating = false;

  /**
   * Currently active panel
   * @type {TabPanel | null}
   */
  activePanel = null;
  
  connectedCallback() {
    super.connectedCallback();
    this.requiredRefs = ['tabButtons', 'tabPanels'];
    this.injectStyles();
    this.initializeTabs();
  }

  injectStyles() {
    if (this.querySelector('style[data-tabs-styles]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-tabs-styles', '');
    style.textContent = `
      tabs-component {
        display: block;
      }

      .tab-panels-container {
        position: relative;
      }

      tab-panel {
        display: block;
      }

      /* Hidden panels: position absolute, no layout impact */
      /* Override default hidden behavior (display:none) with position-based hiding */
      tab-panel[hidden] {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      }
    `;

    this.appendChild(style);
  }

  initializeTabs() {
    const firstTab = /** @type {Element} */ (this.refs.tabButtons?.[0]);
    if (firstTab) {
      const firstPanelId = firstTab.getAttribute('aria-controls');
      const panels = /** @type {TabPanel[]} */ (this.refs.tabPanels || []);
      this.activePanel = panels.find(panel => panel.id === firstPanelId) || null;
      this.activateTab(firstTab, false);
    }
  }

  /**
   * Handle tab button click
   * @param {Event} event
   */
  handleTabClick(event) {
    const button = /** @type {Element} */ (event.target);
    this.activateTab(button, true);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const currentButton = /** @type {Element} */ (event.target);
    const buttons = /** @type {Element[]} */ (this.refs.tabButtons || []);
    const currentIndex = buttons.indexOf(currentButton);

    let targetIndex = -1;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = buttons.length - 1;
        break;
      default:
        return;
    }

    if (targetIndex !== -1 && buttons[targetIndex]) {
      const targetButton = /** @type {HTMLElement} */ (buttons[targetIndex]);
      this.activateTab(targetButton, true);
      targetButton.focus();
    }
  }

  /**
   * Change tab with GSAP crossfade animation
   * @param {TabPanel} selectedPanel
   */
  changeTab(selectedPanel) {
    if (this.isAnimating) return;
    if (this.activePanel === selectedPanel) return;

    this.setAnimating(true);
    
    const oldPanel = this.activePanel;
    
    selectedPanel.show(() => {
      this.setAnimating(false);
    });
    
    if (oldPanel) {
      oldPanel.hide();
    }
    
    this.activePanel = selectedPanel;
  }

  /**
   * Set animating state
   * @param {boolean} animating
   */
  setAnimating(animating = true) {
    this.isAnimating = animating;
    this.classList.toggle('is-animating', animating);
  }

  /**
   * Activate a specific tab
   * @param {Element} button
   * @param {boolean} animate - Whether to animate the transition
   */
  activateTab(button, animate = false) {
    if (animate && this.isAnimating) return;

    const targetPanelId = button.getAttribute('aria-controls');
    const buttons = /** @type {Element[]} */ (this.refs.tabButtons || []);
    const panels = /** @type {TabPanel[]} */ (this.refs.tabPanels || []);
    
    const newPanel = panels.find(panel => panel.id === targetPanelId);
    if (!newPanel) return;

    buttons.forEach((btn) => {
      const isSelected = btn === button;
      btn.setAttribute('aria-selected', isSelected.toString());
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    if (animate && this.activePanel && this.activePanel !== newPanel) {
      this.changeTab(newPanel);
    } else {
      panels.forEach((panel) => {
        const shouldShow = panel.id === targetPanelId;
        if (shouldShow) {
          panel.showInstant();
        } else {
          panel.hideInstant();
        }
      });
      
      this.activePanel = newPanel;
    }
  }
}

customElements.define('tabs-component', Tabs);
