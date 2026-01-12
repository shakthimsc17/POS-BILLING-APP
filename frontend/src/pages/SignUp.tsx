import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './Auth.css';

interface SignUpProps {
  onNavigate: (page: 'signin') => void;
}

export default function SignUp({ onNavigate }: SignUpProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { signUp, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, name);
    
    if (signUpError) {
      console.error('SignUp error:', signUpError);
      // Handle different error types
      let errorMessage = 'Failed to create account';
      
      if (signUpError.message) {
        errorMessage = signUpError.message;
      } else if (typeof signUpError === 'string') {
        errorMessage = signUpError;
      } else if (signUpError.error_description) {
        errorMessage = signUpError.error_description;
      } else if (signUpError.msg) {
        errorMessage = signUpError.msg;
      }
      
      // Common error messages
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (errorMessage.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password does not meet requirements.';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Email error: ' + errorMessage;
      }
      
      setError(errorMessage);
    } else if (needsEmailConfirmation) {
      setNeedsConfirmation(true);
      setSuccess(true);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onNavigate('signin');
      }, 2000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🛒 POS System</h1>
          <h2>Create Account</h2>
          <p>Sign up to get started with your POS system.</p>
        </div>

        {success ? (
          <div className="success-message">
            {needsConfirmation ? (
              <>
                <p>✅ Account created successfully!</p>
                <p>📧 Please check your email to confirm your account.</p>
                <p>Once confirmed, you can sign in.</p>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => onNavigate('signin')}
                  style={{ marginTop: '1rem' }}
                >
                  Go to Sign In
                </button>
              </>
            ) : (
              <>
                <p>✅ Account created successfully!</p>
                <p>Redirecting to sign in...</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <small>Must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              className="link-button"
              onClick={() => onNavigate('signin')}
              disabled={loading || success}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

