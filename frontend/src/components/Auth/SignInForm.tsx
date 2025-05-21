import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import '../../styles/Auth.css';

interface SignInFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  onToggleForm: () => void;
  isLoading: boolean;
}

const SignInForm = ({ onSubmit, onToggleForm, isLoading }: SignInFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      await onSubmit(username, password);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <FiUser />
          </div>
          <input 
            type="text" 
            placeholder="Username or Email" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
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
          />
          <div 
            className="password-toggle-icon" 
            onClick={togglePasswordVisibility}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </div>
        </div>
        
        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" className="forgot-password">Forgot password?</a>
        </div>
        
        <motion.button 
          type="submit"
          className="auth-button"
          disabled={isLoading || !username || !password}
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
