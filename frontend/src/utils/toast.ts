export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

let toastContainer: HTMLDivElement | null = null;

function createToastContainer() {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function createToastElement(options: ToastOptions): HTMLDivElement {
  const toast = document.createElement('div');
  const type = options.type || 'success';
  const duration = options.duration || 3000;
  
  const backgroundColor = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  }[type];
  
  toast.style.cssText = `
    background-color: ${backgroundColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 250px;
    max-width: 400px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[type];
  
  toast.innerHTML = `<span style="font-weight: bold; font-size: 16px;">${icon}</span> ${options.message}`;
  
  // Add animation styles
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
}

export const toast = {
  success: (message: string, duration?: number) => {
    const container = createToastContainer();
    const toastElement = createToastElement({ message, type: 'success', duration });
    container.appendChild(toastElement);
  },
  
  error: (message: string, duration?: number) => {
    const container = createToastContainer();
    const toastElement = createToastElement({ message, type: 'error', duration });
    container.appendChild(toastElement);
  },
  
  info: (message: string, duration?: number) => {
    const container = createToastContainer();
    const toastElement = createToastElement({ message, type: 'info', duration });
    container.appendChild(toastElement);
  }
};
