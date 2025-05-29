import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiShield, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import PasswordGenerator from './PasswordGenerator';
import '../../styles/Auth.css';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onSubmit: (username: string, email: string, password: string) => Promise<void>;
  onToggleForm: (email?: string) => void;
  isLoading: boolean;
  prefilledEmail?: string;
}

const SignUpForm = ({ onSubmit, onToggleForm, isLoading, prefilledEmail }: SignUpFormProps) => {
  const { checkEmailAvailability, checkUsernameAvailability, authError, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [emailAvailable, setEmailAvailable] = useState(true);

  // Helper functions (declared first)
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  // Password match check (declared before isFormValid)
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  // Form validation (now passwordsMatch is available)
  const isFormValid = useCallback(() => {
    return usernameAvailable && 
           emailAvailable &&
           username.length >= 3 &&
           isValidEmail(email) &&
           isValidPassword(password) &&
           passwordsMatch &&
           agreedToTerms;
  }, [usernameAvailable, emailAvailable, username, email, password, passwordsMatch, agreedToTerms]);

  // Debounced username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length >= 3) {
        const available = await checkUsernameAvailability(username);
        setUsernameAvailable(available);
      }
    };
    
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailability]);

  // Debounced email availability check
  useEffect(() => {
    const checkEmail = async () => {
      if (email.includes('@')) {
        const available = await checkEmailAvailability(email);
        setEmailAvailable(available);
      }
    };
    
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email, checkEmailAvailability]);

  // Handle prefilled email
  useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isFormValid()) {
      await onSubmit(username, email, password);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleGeneratePassword = (generatedPassword: string) => {
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
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
            className={!usernameAvailable ? 'input-error' : ''}
          />
          {!usernameAvailable && (
            <p className="error-message">
              A user already exists with this username, if this is you,{' '}
              <button 
                type="button" 
                className="inline-link"
                onClick={() => onToggleForm(email)}
              >
                Sign In
              </button>
            </p>
          )}
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
            className={!emailAvailable ? 'input-error' : ''}
          />
          {!emailAvailable && (
            <p className="error-message">
              A user already exists with this email, if this is you,{' '}
              <button 
                type="button" 
                className="inline-link"
                onClick={() => onToggleForm(email)}
              >
                Sign In
              </button>
            </p>
          )}
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
              onClick={() => setShowPasswordGenerator(true)}
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
        
        {authError?.field === 'email' || authError?.field === 'username' ? (
          <div className="form-error">
            {authError.message}{' '}
            <button 
              type="button" 
              className="inline-link"
              onClick={() => onToggleForm(email)}
            >
              Sign In
            </button>
          </div>
        ) : authError?.message ? (
          <div className="form-error">{authError.message}</div>
        ) : null}
        
        <motion.button 
          type="submit"
          className="auth-button"
          disabled={isLoading || !isFormValid()}
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
          onClick={() => onToggleForm()}
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