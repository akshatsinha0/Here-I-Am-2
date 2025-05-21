import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiShield, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import PasswordGenerator from './PasswordGenerator';
import '../../styles/Auth.css';

interface SignUpFormProps {
  onSubmit: (username: string, email: string, password: string) => Promise<void>;
  onToggleForm: () => void;
  isLoading: boolean;
}

const SignUpForm = ({ onSubmit, onToggleForm, isLoading }: SignUpFormProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email && password && password === confirmPassword && agreedToTerms) {
      await onSubmit(username, email, password);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleGeneratePassword = (generatedPassword: string) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  };

  const handleOpenPasswordGenerator = () => {
    setShowPasswordGenerator(true);
  };

  return (
    <motion.div 
      className="auth-form"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="auth-title">Join HereIAm2</h2>
      <p className="auth-subtitle">Begin your messaging adventure and connect with friends instantly.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-icon">
            <FiUser />
          </div>
          <input 
            type="text" 
            placeholder="Choose a unique username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {username && username.length < 3 && 
            <p className="error-message">Username must be at least 3 characters</p>
          }
        </div>
        
        <div className="form-group">
          <div className="input-icon">
            <FiMail />
          </div>
          <input 
            type="email" 
            placeholder="Your email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={email && !isValidEmail(email) ? 'input-error' : ''}
          />
          {email && !isValidEmail(email) && 
            <p className="error-message">Please enter a valid email address</p>
          }
        </div>
        
        <div className="form-group password-field">
          <div className="input-icon">
            <FiLock />
          </div>
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Create a secure password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={password && !isValidPassword(password) ? 'input-error' : ''}
          />
          <div className="password-actions">
            <button
              type="button"
              className="password-toggle-icon generator-icon" 
              onClick={handleOpenPasswordGenerator}
              title="Generate secure password"
              aria-label="Open password generator"
            >
              <FiKey />
            </button>
            <button
              type="button" 
              className="password-toggle-icon" 
              onClick={togglePasswordVisibility}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {password && !isValidPassword(password) && 
            <p className="error-message">Password must be at least 8 characters</p>
          }
        </div>
        
        <div className="form-group password-field">
          <div className="input-icon">
            <FiShield />
          </div>
          <input 
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={confirmPassword && !passwordsMatch ? 'input-error' : ''}
          />
          <button
            type="button"
            className="password-toggle-icon" 
            onClick={toggleConfirmPasswordVisibility}
            title={showConfirmPassword ? "Hide password" : "Show password"}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </button>
          {confirmPassword && !passwordsMatch && 
            <p className="error-message">Passwords don't match</p>
          }
        </div>
        
        <div className="form-options">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={agreedToTerms}
              onChange={() => setAgreedToTerms(!agreedToTerms)}
              required
            />
            <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
          </label>
        </div>
        
        <motion.button 
          type="submit"
          className="auth-button"
          disabled={
            isLoading || 
            !username || 
            username.length < 3 ||
            !email || 
            !isValidEmail(email) || 
            !password || 
            !isValidPassword(password) || 
            !passwordsMatch ||
            !agreedToTerms
          }
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <span className="loading-spinner">
              <span className="spinner"></span>
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </form>
      
      <div className="auth-footer">
        <p>Already have an account?</p>
        <motion.button 
          type="button"
          className="toggle-form-button"
          onClick={onToggleForm}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Sign In
        </motion.button>
      </div>

      <PasswordGenerator 
        isOpen={showPasswordGenerator}
        onClose={() => setShowPasswordGenerator(false)}
        onSelectPassword={handleGeneratePassword}
      />
    </motion.div>
  );
};

export default SignUpForm;
