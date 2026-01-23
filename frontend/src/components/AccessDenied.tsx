import './AccessDenied.css';

export default function AccessDenied() {
  return (
    <div className="access-denied">
      <div className="access-denied-content">
        <div className="access-denied-icon">🚫</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p className="access-denied-hint">
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

