import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './EmailVerificationStatus.css'; // Assuming you have a CSS file for styles

const EmailVerificationStatus = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  const handleResend = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: currentUser?.email })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to resend verification email');
      
      setSuccess('New verification email sent! Check your inbox.');
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    let timer = 30;
    const interval = setInterval(() => {
      timer -= 1;
      setCooldown(timer);
      if (timer <= 0) clearInterval(interval);
    }, 1000);
  };

  return (
    <div className="email-verification-status">
      <motion.div 
        className="verification-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="status-icon">
          {success ? (
            <FiCheckCircle className="success-icon" />
          ) : error ? (
            <FiAlertCircle className="error-icon" />
          ) : (
            <FiMail className="default-icon" />
          )}
        </div>

        <h2>Verify Your Email Address</h2>
        
        <div className="verification-details">
          <p>
            A verification link has been sent to: <br />
            <strong>{currentUser?.email}</strong>
          </p>
          
          <p className="instruction-text">
            Please check your inbox and click the link to activate your account.
          </p>
        </div>

        <div className="status-messages">
          {error && (
            <div className="error-message">
              <FiAlertCircle /> {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              <FiCheckCircle /> {success}
            </div>
          )}
        </div>

        <motion.button
          onClick={handleResend}
          disabled={isLoading || cooldown > 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="resend-button"
        >
          {isLoading ? (
            <div className="button-loading">
              <FiClock className="spin-icon" /> Sending...
            </div>
          ) : (
            `Resend Email${cooldown > 0 ? ` (${cooldown}s)` : ''}`
          )}
        </motion.button>

        <div className="secondary-options">
          <button 
            onClick={() => navigate('/login')}
            className="back-link"
          >
            Return to Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="alternate-action"
          >
            Use different email
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationStatus;
