import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  message = 'Loading...',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinnerClass = `loading-spinner ${size} ${fullScreen ? 'full-screen' : ''}`;
  
  return (
    <div className={spinnerClass}>
      <div className="spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

