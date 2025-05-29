import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiRefreshCw } from 'react-icons/fi';

const VerificationResend = () => {  
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);

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
      
      if (!response.ok) throw new Error(data.error || 'Failed to resend email');
      
      setSuccess('New verification email sent successfully!');
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    let timer = 30;
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer <= 0) clearInterval(interval);
    }, 1000);
  };

  return (
    <div className="verification-resend-container">
      <motion.div 
        className="verification-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="verification-icon">
          <FiMail size={64} />
        </div>
        
        <h2>Verify Your Email Address</h2>
        
        <p className="verification-text">
          We've sent a verification link to <strong>{currentUser?.email}</strong>.
          Please check your inbox and spam folder.
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <motion.button
          onClick={handleResend}
          disabled={isLoading || countdown > 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="resend-button"
        >
          {isLoading ? (
            <FiRefreshCw className="spin-icon" />
          ) : (
            `Resend Email ${countdown > 0 ? `(${countdown})` : ''}`
          )}
        </motion.button>

        <button 
          onClick={() => navigate('/login')}
          className="back-to-login"
        >
          Return to Login
        </button>
      </motion.div>
    </div>
  );
};

export default VerificationResend;
