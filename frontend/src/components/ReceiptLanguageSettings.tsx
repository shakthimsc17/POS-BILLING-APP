import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const ReceiptLanguageSettings: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = async (newLanguage: 'en' | 'ta') => {
    await setLanguage(newLanguage);
  };

  return (
    <tr>
      <td className="setting-label">Receipt Language</td>
      <td>
        <div className="language-buttons">
          <button
            className={`language-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
            disabled={false}
          >
            🇬🇧 English
          </button>
          <button
            className={`language-btn ${language === 'ta' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('ta')}
            disabled={false}
          >
            🇮🇳 தமிழ்
          </button>
        </div>
      </td>
      <td className="setting-description">
        Choose language for printing receipts (Tamil supports item names and headers)
      </td>
    </tr>
  );
};

export default ReceiptLanguageSettings;
