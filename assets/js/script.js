/**
 * ShoeStore Landing Page - Interactive Features & Performance Optimization
 * 
 * @generated-from: task-id:SHOE-008 sprint:current
 * @modifies: index.html:v1.0.0
 * @dependencies: ["index.html", "assets/css/styles.css"]
 * 
 * Features:
 * - Lazy loading for images with Intersection Observer
 * - Smooth scrolling navigation
 * - Mobile menu toggle
 * - Form validation with accessibility
 * - Performance optimizations
 * - Error handling and logging
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION & CONSTANTS
  // ============================================================================

  const CONFIG = Object.freeze({
    LAZY_LOAD: {
      rootMargin: '50px',
      threshold: 0.01,
      loadingClass: 'lazy-loading',
      loadedClass: 'lazy-loaded',
      errorClass: 'lazy-error'
    },
    SMOOTH_SCROLL: {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    },
    MOBILE_BREAKPOINT: 768,
    DEBOUNCE_DELAY: 150,
    FORM_VALIDATION: {
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phonePattern: /^[\d\s\-\+\(\)]+$/,
      minNameLength: 2,
      minSubjectLength: 3,
      minMessageLength: 10
    },
    PERFORMANCE: {
      enableMetrics: true,
      logErrors: true
    }
  });

  const SELECTORS = Object.freeze({
    lazyImages: 'img[loading="lazy"]',
    navLinks: 'nav a[href^="#"]',
    mobileMenuToggle: '.mobile-menu-toggle',
    mobileMenu: 'nav',
    contactForm: '.contact-form',
    newsletterForm: '.newsletter-form',
    skipLink: '.skip-link'
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Debounce function to limit execution rate
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Log performance metrics
   * @param {string} label - Metric label
   * @param {number} startTime - Start timestamp
   */
  function logPerformance(label, startTime) {
    if (!CONFIG.PERFORMANCE.enableMetrics) return;
    
    const duration = performance.now() - startTime;
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Log errors with context
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  function logError(context, error) {
    if (!CONFIG.PERFORMANCE.logErrors) return;
    
    console.error(`[Error] ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sanitize user input to prevent XSS
   * @param {string} input - User input
   * @returns {string} Sanitized input
   */
  function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // ============================================================================
  // LAZY LOADING IMPLEMENTATION
  // ============================================================================

  class LazyLoader {
    constructor() {
      this.observer = null;
      this.images = [];
      this.loadedCount = 0;
      this.errorCount = 0;
    }

    /**
     * Initialize lazy loading with Intersection Observer
     */
    init() {
      const startTime = performance.now();

      try {
        // Check for Intersection Observer support
        if (!('IntersectionObserver' in window)) {
          console.warn('[LazyLoader] IntersectionObserver not supported, loading all images');
          this.loadAllImages();
          return;
        }

        this.images = Array.from(document.querySelectorAll(SELECTORS.lazyImages));
        
        if (this.images.length === 0) {
          console.log('[LazyLoader] No lazy-loadable images found');
          return;
        }

        this.observer = new IntersectionObserver(
          this.handleIntersection.bind(this),
          {
            rootMargin: CONFIG.LAZY_LOAD.rootMargin,
            threshold: CONFIG.LAZY_LOAD.threshold
          }
        );

        this.images.forEach(img => {
          img.classList.add(CONFIG.LAZY_LOAD.loadingClass);
          this.observer.observe(img);
        });

        logPerformance('LazyLoader initialized', startTime);
        console.log(`[LazyLoader] Observing ${this.images.length} images`);
      } catch (error) {
        logError('LazyLoader initialization', error);
        this.loadAllImages();
      }
    }

    /**
     * Handle intersection observer callback
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    handleIntersection(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }

    /**
     * Load individual image
     * @param {HTMLImageElement} img - Image element
     */
    loadImage(img) {
      const startTime = performance.now();

      // Handle picture element sources
      const picture = img.closest('picture');
      if (picture) {
        const sources = picture.querySelectorAll('source');
        sources.forEach(source => {
          if (source.dataset.srcset) {
            source.srcset = source.dataset.srcset;
            source.removeAttribute('data-srcset');
          }
        });
      }

      // Load main image
      const originalSrc = img.src;
      
      img.addEventListener('load', () => {
        img.classList.remove(CONFIG.LAZY_LOAD.loadingClass);
        img.classList.add(CONFIG.LAZY_LOAD.loadedClass);
        this.loadedCount++;
        logPerformance(`Image loaded: ${img.alt || 'unnamed'}`, startTime);
      }, { once: true });

      img.addEventListener('error', () => {
        img.classList.remove(CONFIG.LAZY_LOAD.loadingClass);
        img.classList.add(CONFIG.LAZY_LOAD.errorClass);
        this.errorCount++;
        logError('Image loading failed', new Error(`Failed to load: ${originalSrc}`));
      }, { once: true });

      // Trigger load if src is already set, otherwise it will load naturally
      if (img.complete && img.naturalHeight !== 0) {
        img.dispatchEvent(new Event('load'));
      }
    }

    /**
     * Fallback: Load all images immediately
     */
    loadAllImages() {
      const images = document.querySelectorAll(SELECTORS.lazyImages);
      images.forEach(img => {
        img.loading = 'eager';
        this.loadImage(img);
      });
    }

    /**
     * Cleanup observer
     */
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  // ============================================================================
  // SMOOTH SCROLLING NAVIGATION
  // ============================================================================

  class SmoothScroll {
    constructor() {
      this.links = [];
    }

    /**
     * Initialize smooth scrolling for navigation links
     */
    init() {
      try {
        this.links = Array.from(document.querySelectorAll(SELECTORS.navLinks));
        
        if (this.links.length === 0) {
          console.log('[SmoothScroll] No navigation links found');
          return;
        }

        this.links.forEach(link => {
          link.addEventListener('click', this.handleClick.bind(this));
        });

        // Handle skip link
        const skipLink = document.querySelector(SELECTORS.skipLink);
        if (skipLink) {
          skipLink.addEventListener('click', this.handleClick.bind(this));
        }

        console.log(`[SmoothScroll] Initialized for ${this.links.length} links`);
      } catch (error) {
        logError('SmoothScroll initialization', error);
      }
    }

    /**
     * Handle navigation link click
     * @param {Event} event - Click event
     */
    handleClick(event) {
      const href = event.currentTarget.getAttribute('href');
      
      if (!href || !href.startsWith('#')) return;

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        console.warn(`[SmoothScroll] Target element not found: ${targetId}`);
        return;
      }

      event.preventDefault();

      try {
        // Use native smooth scroll if supported
        if ('scrollBehavior' in document.documentElement.style) {
          targetElement.scrollIntoView(CONFIG.SMOOTH_SCROLL);
        } else {
          // Fallback for older browsers
          targetElement.scrollIntoView();
        }

        // Update URL without triggering navigation
        if (history.pushState) {
          history.pushState(null, '', href);
        }

        // Set focus for accessibility
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
        
        // Remove tabindex after focus
        targetElement.addEventListener('blur', () => {
          targetElement.removeAttribute('tabindex');
        }, { once: true });

      } catch (error) {
        logError('SmoothScroll navigation', error);
      }
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
      this.links.forEach(link => {
        link.removeEventListener('click', this.handleClick);
      });
    }
  }

  // ============================================================================
  // MOBILE MENU FUNCTIONALITY
  // ============================================================================

  class MobileMenu {
    constructor() {
      this.toggle = null;
      this.menu = null;
      this.isOpen = false;
      this.handleResize = debounce(this.onResize.bind(this), CONFIG.DEBOUNCE_DELAY);
    }

    /**
     * Initialize mobile menu
     */
    init() {
      try {
        this.menu = document.querySelector(SELECTORS.mobileMenu);
        
        if (!this.menu) {
          console.log('[MobileMenu] Navigation menu not found');
          return;
        }

        // Create mobile menu toggle button if it doesn't exist
        this.toggle = document.querySelector(SELECTORS.mobileMenuToggle);
        if (!this.toggle) {
          this.createToggleButton();
        }

        this.setupEventListeners();
        this.updateMenuState();

        console.log('[MobileMenu] Initialized');
      } catch (error) {
        logError('MobileMenu initialization', error);
      }
    }

    /**
     * Create mobile menu toggle button
     */
    createToggleButton() {
      this.toggle = document.createElement('button');
      this.toggle.className = 'mobile-menu-toggle';
      this.toggle.setAttribute('aria-label', 'Toggle navigation menu');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.toggle.setAttribute('aria-controls', 'main-navigation');
      
      // Create hamburger icon
      this.toggle.innerHTML = `
        <span class="menu-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      `;

      // Insert before navigation
      this.menu.parentNode.insertBefore(this.toggle, this.menu);
      
      // Add ID to menu for aria-controls
      if (!this.menu.id) {
        this.menu.id = 'main-navigation';
      }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      if (this.toggle) {
        this.toggle.addEventListener('click', this.toggleMenu.bind(this));
      }

      window.addEventListener('resize', this.handleResize);
      
      // Close menu when clicking outside
      document.addEventListener('click', this.handleOutsideClick.bind(this));
      
      // Close menu on escape key
      document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    }

    /**
     * Toggle menu open/closed
     */
    toggleMenu() {
      this.isOpen = !this.isOpen;
      this.updateMenuState();
    }

    /**
     * Update menu state and attributes
     */
    updateMenuState() {
      const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
      
      if (!isMobile) {
        this.isOpen = false;
      }

      if (this.toggle) {
        this.toggle.setAttribute('aria-expanded', this.isOpen.toString());
        this.toggle.classList.toggle('active', this.isOpen);
      }

      if (this.menu) {
        this.menu.classList.toggle('mobile-menu-open', this.isOpen);
        this.menu.setAttribute('aria-hidden', (!this.isOpen && isMobile).toString());
      }

      // Prevent body scroll when menu is open
      document.body.style.overflow = (this.isOpen && isMobile) ? 'hidden' : '';
    }

    /**
     * Handle window resize
     */
    onResize() {
      this.updateMenuState();
    }

    /**
     * Handle clicks outside menu
     * @param {Event} event - Click event
     */
    handleOutsideClick(event) {
      if (!this.isOpen) return;
      
      const isClickInside = this.menu.contains(event.target) || 
                           (this.toggle && this.toggle.contains(event.target));
      
      if (!isClickInside) {
        this.isOpen = false;
        this.updateMenuState();
      }
    }

    /**
     * Handle escape key press
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscapeKey(event) {
      if (event.key === 'Escape' && this.isOpen) {
        this.isOpen = false;
        this.updateMenuState();
        
        if (this.toggle) {
          this.toggle.focus();
        }
      }
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
      if (this.toggle) {
        this.toggle.removeEventListener('click', this.toggleMenu);
      }
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('click', this.handleOutsideClick);
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
  }

  // ============================================================================
  // FORM VALIDATION
  // ============================================================================

  class FormValidator {
    constructor() {
      this.forms = [];
    }

    /**
     * Initialize form validation
     */
    init() {
      try {
        const contactForm = document.querySelector(SELECTORS.contactForm);
        const newsletterForm = document.querySelector(SELECTORS.newsletterForm);

        if (contactForm) {
          this.setupForm(contactForm, this.validateContactForm.bind(this));
        }

        if (newsletterForm) {
          this.setupForm(newsletterForm, this.validateNewsletterForm.bind(this));
        }

        console.log('[FormValidator] Initialized');
      } catch (error) {
        logError('FormValidator initialization', error);
      }
    }

    /**
     * Setup form with validation
     * @param {HTMLFormElement} form - Form element
     * @param {Function} validator - Validation function
     */
    setupForm(form, validator) {
      this.forms.push(form);

      // Real-time validation on blur
      const inputs = form.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });

        // Clear error on input
        input.addEventListener('input', () => {
          this.clearFieldError(input);
        });
      });

      // Form submission
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        if (validator(form)) {
          this.handleFormSubmit(form);
        }
      });
    }

    /**
     * Validate contact form
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} Validation result
     */
    validateContactForm(form) {
      const name = form.querySelector('#contact-name');
      const email = form.querySelector('#contact-email');
      const phone = form.querySelector('#contact-phone');
      const subject = form.querySelector('#contact-subject');
      const message = form.querySelector('#contact-message');

      let isValid = true;

      // Validate name
      if (!this.validateName(name)) {
        isValid = false;
      }

      // Validate email
      if (!this.validateEmail(email)) {
        isValid = false;
      }

      // Validate phone (optional but must be valid if provided)
      if (phone && phone.value.trim() && !this.validatePhone(phone)) {
        isValid = false;
      }

      // Validate subject
      if (!this.validateSubject(subject)) {
        isValid = false;
      }

      // Validate message
      if (!this.validateMessage(message)) {
        isValid = false;
      }

      return isValid;
    }

    /**
     * Validate newsletter form
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} Validation result
     */
    validateNewsletterForm(form) {
      const email = form.querySelector('#newsletter-email');
      return this.validateEmail(email);
    }

    /**
     * Validate individual field
     * @param {HTMLInputElement} field - Input field
     * @returns {boolean} Validation result
     */
    validateField(field) {
      if (!field) return true;

      const fieldType = field.type || field.tagName.toLowerCase();
      const fieldId = field.id;

      if (fieldId.includes('name')) {
        return this.validateName(field);
      } else if (fieldId.includes('email')) {
        return this.validateEmail(field);
      } else if (fieldId.includes('phone')) {
        return this.validatePhone(field);
      } else if (fieldId.includes('subject')) {
        return this.validateSubject(field);
      } else if (fieldId.includes('message')) {
        return this.validateMessage(field);
      }

      return true;
    }

    /**
     * Validate name field
     * @param {HTMLInputElement} field - Name field
     * @returns {boolean} Validation result
     */
    validateName(field) {
      const value = field.value.trim();
      
      if (value.length < CONFIG.FORM_VALIDATION.minNameLength) {
        this.showFieldError(field, `Name must be at least ${CONFIG.FORM_VALIDATION.minNameLength} characters`);
        return false;
      }

      this.clearFieldError(field);
      return true;
    }

    /**
     * Validate email field
     * @param {HTMLInputElement} field - Email field
     * @returns {boolean} Validation result
     */
    validateEmail(field) {
      const value = field.value.trim();
      
      if (!CONFIG.FORM_VALIDATION.emailPattern.test(value)) {
        this.showFieldError(field, 'Please enter a valid email address');
        return false;
      }

      this.clearFieldError(field);
      return true;
    }

    /**
     * Validate phone field
     * @param {HTMLInputElement} field - Phone field
     * @returns {boolean} Validation result
     */
    validatePhone(field) {
      const value = field.value.trim();
      
      if (value && !CONFIG.FORM_VALIDATION.phonePattern.test(value)) {
        this.showFieldError(field, 'Please enter a valid phone number');
        return false;
      }

      this.clearFieldError(field);
      return true;
    }

    /**
     * Validate subject field
     * @param {HTMLInputElement} field - Subject field
     * @returns {boolean} Validation result
     */
    validateSubject(field) {
      const value = field.value.trim();
      
      if (value.length < CONFIG.FORM_VALIDATION.minSubjectLength) {
        this.showFieldError(field, `Subject must be at least ${CONFIG.FORM_VALIDATION.minSubjectLength} characters`);
        return false;
      }

      this.clearFieldError(field);
      return true;
    }

    /**
     * Validate message field
     * @param {HTMLTextAreaElement} field - Message field
     * @returns {boolean} Validation result
     */
    validateMessage(field) {
      const value = field.value.trim();
      
      if (value.length < CONFIG.FORM_VALIDATION.minMessageLength) {
        this.showFieldError(field, `Message must be at least ${CONFIG.FORM_VALIDATION.minMessageLength} characters`);
        return false;
      }

      this.clearFieldError(field);
      return true;
    }

    /**
     * Show field error
     * @param {HTMLElement} field - Input field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
      const formField = field.closest('.form-field');
      if (!formField) return;

      // Remove existing error
      this.clearFieldError(field);

      // Add error class
      formField.classList.add('field-error');
      field.setAttribute('aria-invalid', 'true');

      // Create error message
      const errorId = `${field.id}-error`;
      const errorElement = document.createElement('span');
      errorElement.id = errorId;
      errorElement.className = 'field-error-message';
      errorElement.textContent = sanitizeInput(message);
      errorElement.setAttribute('role', 'alert');

      formField.appendChild(errorElement);
      field.setAttribute('aria-describedby', errorId);
    }

    /**
     * Clear field error
     * @param {HTMLElement} field - Input field
     */
    clearFieldError(field) {
      const formField = field.closest('.form-field');
      if (!formField) return;

      formField.classList.remove('field-error');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');

      const errorElement = formField.querySelector('.field-error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }

    /**
     * Handle form submission
     * @param {HTMLFormElement} form - Form element
     */
    handleFormSubmit(form) {
      const startTime = performance.now();

      try {
        // Get form data
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
          data[key] = sanitizeInput(value);
        });

        console.log('[FormValidator] Form submitted:', data);

        // Show success message
        this.showFormSuccess(form);

        // Reset form
        form.reset();

        logPerformance('Form submission', startTime);
      } catch (error) {
        logError('Form submission', error);
        this.showFormError(form, 'An error occurred. Please try again.');
      }
    }

    /**
     * Show form success message
     * @param {HTMLFormElement} form - Form element
     */
    showFormSuccess(form) {
      const message = document.createElement('div');
      message.className = 'form-message form-success';
      message.textContent = 'Thank you! Your message has been sent successfully.';
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');

      form.insertAdjacentElement('beforebegin', message);

      setTimeout(() => {
        message.remove();
      }, 5000);
    }

    /**
     * Show form error message
     * @param {HTMLFormElement} form - Form element
     * @param {string} errorMessage - Error message
     */
    showFormError(form, errorMessage) {
      const message = document.createElement('div');
      message.className = 'form-message form-error';
      message.textContent = sanitizeInput(errorMessage);
      message.setAttribute('role', 'alert');
      message.setAttribute('aria-live', 'assertive');

      form.insertAdjacentElement('beforebegin', message);

      setTimeout(() => {
        message.remove();
      }, 5000);
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
      this.forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.removeEventListener('blur', this.validateField);
          input.removeEventListener('input', this.clearFieldError);
        });
      });
    }
  }

  // ============================================================================
  // PERFORMANCE OPTIMIZATION
  // ============================================================================

  class PerformanceOptimizer {
    constructor() {
      this.metrics = {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      };
    }

    /**
     * Initialize performance monitoring
     */
    init() {
      try {
        this.measureLoadTime();
        this.measurePaintMetrics();
        this.optimizeResources();

        console.log('[PerformanceOptimizer] Initialized');
      } catch (error) {
        logError('PerformanceOptimizer initialization', error);
      }
    }

    /**
     * Measure page load time
     */
    measureLoadTime() {
      if (!window.performance || !window.performance.timing) return;

      const timing = window.performance.timing;
      this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;

      console.log('[Performance] Page load time:', this.metrics.loadTime + 'ms');
      console.log('[Performance] DOM content loaded:', this.metrics.domContentLoaded + 'ms');
    }

    /**
     * Measure paint metrics
     */
    measurePaintMetrics() {
      if (!window.performance || !window.performance.getEntriesByType) return;

      const paintEntries = window.performance.getEntriesByType('paint');
      
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
          console.log('[Performance] First paint:', entry.startTime.toFixed(2) + 'ms');
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          console.log('[Performance] First contentful paint:', entry.startTime.toFixed(2) + 'ms');
        }
      });
    }

    /**
     * Optimize resource loading
     */
    optimizeResources() {
      // Preconnect to external domains
      this.addPreconnect('https://fonts.googleapis.com');
      this.addPreconnect('https://fonts.gstatic.com');

      // Add resource hints for critical resources
      this.addPrefetch('/assets/css/styles.css');
    }

    /**
     * Add preconnect link
     * @param {string} url - URL to preconnect
     */
    addPreconnect(url) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    /**
     * Add prefetch link
     * @param {string} url - URL to prefetch
     */
    addPrefetch(url) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
      return { ...this.metrics };
    }
  }

  // ============================================================================
  // APPLICATION INITIALIZATION
  // ============================================================================

  class App {
    constructor() {
      this.lazyLoader = new LazyLoader();
      this.smoothScroll = new SmoothScroll();
      this.mobileMenu = new MobileMenu();
      this.formValidator = new FormValidator();
      this.performanceOptimizer = new PerformanceOptimizer();
      this.initialized = false;
    }

    /**
     * Initialize application
     */
    init() {
      if (this.initialized) {
        console.warn('[App] Already initialized');
        return;
      }

      const startTime = performance.now();

      try {
        console.log('[App] Initializing ShoeStore interactive features...');

        // Initialize all modules
        this.lazyLoader.init();
        this.smoothScroll.init();
        this.mobileMenu.init();
        this.formValidator.init();
        this.performanceOptimizer.init();

        this.initialized = true;

        logPerformance('App initialization', startTime);
        console.log('[App] All features initialized successfully');

        // Log final metrics after page load
        window.addEventListener('load', () => {
          setTimeout(() => {
            const metrics = this.performanceOptimizer.getMetrics();
            console.log('[App] Final performance metrics:', metrics);
          }, 0);
        });

      } catch (error) {
        logError('App initialization', error);
      }
    }

    /**
     * Cleanup and destroy all modules
     */
    destroy() {
      try {
        this.lazyLoader.destroy();
        this.smoothScroll.destroy();
        this.mobileMenu.destroy();
        this.formValidator.destroy();

        this.initialized = false;
        console.log('[App] Cleanup completed');
      } catch (error) {
        logError('App cleanup', error);
      }
    }
  }

  // ============================================================================
  // AUTO-INITIALIZATION
  // ============================================================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const app = new App();
      app.init();
      
      // Expose app instance for debugging
      window.ShoeStoreApp = app;
    });
  } else {
    // DOM already loaded
    const app = new App();
    app.init();
    
    // Expose app instance for debugging
    window.ShoeStoreApp = app;
  }

})();