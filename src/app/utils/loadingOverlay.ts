// Global Loading Overlay Manager
class LoadingOverlay {
  private overlay: HTMLElement | null = null;
  private isVisible: boolean = false;

  constructor() {
    console.log('LoadingOverlay constructor called');
    this.createOverlay();
  }

  private createOverlay(): void {
    // Check if overlay already exists
    if (document.getElementById('global-loading-overlay')) {
      this.overlay = document.getElementById('global-loading-overlay');
      console.log('Loading overlay already exists');
      return;
    }

    // Check if DOM is ready
    if (!document.body) {
      console.log('DOM not ready, waiting...');
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('DOM ready, creating overlay');
          this.createOverlayElement();
        });
      } else {
        // DOM is already ready
        this.createOverlayElement();
      }
      return;
    }

    this.createOverlayElement();
  }

  private createOverlayElement(): void {
    console.log('Creating overlay element');

    // Create overlay element
    this.overlay = document.createElement('div');
    this.overlay.id = 'global-loading-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      pointer-events: none;
      transition: opacity 0.3s ease;
      opacity: 0;
    `;

    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      pointer-events: auto;
    `;

    // Create spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // Create loading text
    const text = document.createElement('p');
    text.textContent = 'Loading...';
    text.style.cssText = `
      color: white;
      font-size: 20px;
      font-weight: bold;
      margin: 0;
    `;

    // Add keyframes for spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    // Assemble elements
    content.appendChild(spinner);
    content.appendChild(text);
    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);

    console.log('Loading overlay created and added to DOM');
  }

  public show(): void {
    if (!this.overlay) {
      console.error('Loading overlay not created yet, creating now...');
      this.createOverlay();
      // Wait a bit for creation
      setTimeout(() => this.show(), 100);
      return;
    }

    console.log('Loading overlay: SHOW - creating overlay if needed');
    this.isVisible = true;
    this.overlay.style.display = 'flex';

    // Force reflow
    this.overlay.offsetHeight;

    this.overlay.style.opacity = '1';
    console.log('Loading overlay: SHOW - overlay should be visible now');
  }

  public hide(): void {
    if (!this.overlay) {
      console.error('Loading overlay not created!');
      return;
    }

    console.log('Loading overlay: HIDE - hiding overlay');
    this.isVisible = false;
    this.overlay.style.opacity = '0';

    // Hide after transition
    setTimeout(() => {
      if (!this.isVisible && this.overlay) {
        this.overlay.style.display = 'none';
        console.log('Loading overlay: HIDE - overlay hidden');
      }
    }, 300);
  }

  public isShowing(): boolean {
    return this.isVisible;
  }
}

// Global instance
const loadingOverlay = new LoadingOverlay();

// Global functions for easy access
(window as any).showLoading = () => loadingOverlay.show();
(window as any).hideLoading = () => loadingOverlay.hide();
(window as any).testLoading = () => {
  console.log('Testing loading overlay...');
  loadingOverlay.show();
  setTimeout(() => {
    loadingOverlay.hide();
    console.log('Loading overlay test complete');
  }, 2000);
};

// Export for module usage
export { loadingOverlay };