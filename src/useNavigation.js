import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();
  
  const goToDashboard = () => navigate('/');
  const goToUpload = () => navigate('/upload');
  const goToFiles = () => navigate('/files');
  const goToEncryption = () => navigate('/encryption');
  const goToCloud = () => navigate('/cloud');
  const goToSettings = () => navigate('/settings');
  
  return {
    goToDashboard,
    goToUpload, 
    goToFiles,
    goToEncryption,
    goToCloud,
    goToSettings
  };
};