import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiRefreshCw, FiCopy, FiCheck, FiShield } from 'react-icons/fi';
import '../../styles/PasswordGenerator.css';

interface PasswordGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword: (password: string) => void;
}

const PasswordGenerator = ({ isOpen, onClose, onSelectPassword }: PasswordGeneratorProps) => {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generatePassword();
    }
  }, [isOpen, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const generatePassword = () => {
    let charset = "";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+{}|:<>?-=[];,./";

    if (charset === "") {
      setIncludeLowercase(true);
      charset = "abcdefghijklmnopqrstuvwxyz";
    }

    let newPassword = "";
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(newPassword);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    onSelectPassword(password);
    onClose();
  };

  const calculatePasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return strength;
  };

  const getStrengthLabel = () => {
    const strength = calculatePasswordStrength();
    if (strength <= 2) return { label: "Vulnerable", color: "#ff4d4d" };
    if (strength <= 4) return { label: "Adequate", color: "#ffa64d" };
    return { label: "Formidable", color: "#66cc66" };
  };

  const strengthInfo = getStrengthLabel();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="password-generator-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="password-generator-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="close-button" 
              onClick={onClose}
              aria-label="Close password generator"
            >
              <FiX />
            </button>

            <div className="generator-header">
              <FiShield className="shield-icon" />
              <h2>Password Fortress Creator</h2>
              <p className="subtitle">
                Forge an impenetrable digital shield with our advanced password synthesis algorithm
              </p>
            </div>

            <div className="password-display">
              <input 
                type="text" 
                value={password} 
                readOnly 
                className="password-input"
                aria-label="Generated password"
              />
              <div className="password-actions">
                <button 
                  className="action-button refresh" 
                  onClick={generatePassword}
                  title="Generate new password"
                  aria-label="Generate new password"
                >
                  <FiRefreshCw />
                </button>
                <button 
                  className="action-button copy" 
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                  aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>

            <div className="strength-meter">
              <div className="strength-label">
                <span>Password Strength</span>
                <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
              </div>
              <div className="strength-bar">
                <div 
                  className="strength-progress" 
                  style={{ 
                    width: `${(calculatePasswordStrength() / 6) * 100}%`,
                    backgroundColor: strengthInfo.color
                  }}
                ></div>
              </div>
            </div>

            <div className="generator-options">
              <div className="option-group">
                <label htmlFor="password-length">Length: {length} characters</label>
                <div className="range-container">
                  <input
                    id="password-length"
                    type="range"
                    min="8"
                    max="32"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="range-slider"
                  />
                  <div className="range-marks">
                    <span>8</span>
                    <span>16</span>
                    <span>24</span>
                    <span>32</span>
                  </div>
                </div>
              </div>
              
              <div className="option-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeUppercase} 
                    onChange={() => setIncludeUppercase(!includeUppercase)}
                  />
                  Include uppercase letters (A-Z)
                </label>
              </div>
              
              <div className="option-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeLowercase} 
                    onChange={() => setIncludeLowercase(!includeLowercase)}
                  />
                  Include lowercase letters (a-z)
                </label>
              </div>
              
              <div className="option-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeNumbers} 
                    onChange={() => setIncludeNumbers(!includeNumbers)}
                  />
                  Include numbers (0-9)
                </label>
              </div>
              
              <div className="option-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeSymbols} 
                    onChange={() => setIncludeSymbols(!includeSymbols)}
                  />
                  Include symbols (!@#$%^&*)
                </label>
              </div>
            </div>

            <button 
              className="use-password-button" 
              onClick={handleUse}
            >
              Deploy This Password
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordGenerator;
