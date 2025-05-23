import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/Auth.css';

interface SignInFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onToggleForm: () => void;
  isLoading: boolean;
}

const SignInForm = ({ onSubmit, onToggleForm, isLoading }: SignInFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onSubmit(email, password);
    }
  };

  return (
    <motion.div 
      className="auth-form"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="auth-title">Welcome Back</h2>
      <p className="auth-subtitle">Delighted to see you again! Enter your credentials to continue your journey.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-icon">
            <FiMail />
          </div>
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        
        <div className="form-group">
          <div className="input-icon">
            <FiLock />
          </div>
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button 
            type="button"
            className="password-toggle-icon" 
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        
        <motion.button 
          type="submit"
          className="auth-button"
          disabled={isLoading || !email || !password}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <span className="loading-spinner">
              <span className="spinner"></span>
              Signing In...
            </span>
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>
      
      <div className="auth-footer">
        <p>New to HereIAm2?</p>
        <motion.button 
          type="button"
          className="toggle-form-button"
          onClick={onToggleForm}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create an Account
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SignInForm;
