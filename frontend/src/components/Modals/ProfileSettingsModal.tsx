import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiCamera, FiSave } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileSettingsModal.css';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSettingsModal = ({ isOpen, onClose }: ProfileSettingsModalProps) => {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="profile-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Profile Settings</h2>
              <button className="close-btn" onClick={onClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="avatar-section">
                <div className="avatar-preview">
                  <img src={formData.avatar} alt="Profile" />
                  <button type="button" className="change-avatar-btn">
                    <FiCamera />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FiUser />
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>
                  <FiMail />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <FiSave />
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileSettingsModal;
