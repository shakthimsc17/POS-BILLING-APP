import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  showLabels?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  showLabels = true 
}) => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLanguage: 'en' | 'ta') => {
    setLanguage(newLanguage);
  };

  return (
    <div className={`language-switcher ${className}`}>
      <div className="language-buttons">
        <button
          className={`language-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('en')}
          title="Switch to English"
          aria-label="Switch to English"
        >
          {showLabels ? (
            <>
              <span className="flag-icon">🇬🇧</span>
              <span className="language-label">English</span>
            </>
          ) : (
            'EN'
          )}
        </button>
        
        <button
          className={`language-btn ${language === 'ta' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('ta')}
          title="தமிழில் மாற்று"
          aria-label="Switch to Tamil"
        >
          {showLabels ? (
            <>
              <span className="flag-icon">🇮🇳</span>
              <span className="language-label">தமிழ்</span>
            </>
          ) : (
            'தமிழ்'
          )}
        </button>
      </div>
      
      <style>{`
        .language-switcher {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .language-buttons {
          display: flex;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 2px;
          border: 1px solid #ddd;
        }

        .language-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
          min-width: 0;
        }

        .language-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }

        .language-btn.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .flag-icon {
          font-size: 16px;
          line-height: 1;
        }

        .language-label {
          font-weight: 500;
        }

        /* Compact mode for mobile */
        @media (max-width: 768px) {
          .language-btn {
            padding: 8px 10px;
            font-size: 12px;
          }

          .flag-icon {
            font-size: 14px;
          }

          .language-label {
            display: none;
          }

          .language-btn:not(.compact) .language-label {
            display: inline;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .language-switcher {
            border: 2px solid #000;
          }

          .language-btn.active {
            background: #000;
            color: #fff;
          }

          .language-btn:hover {
            background: #333;
            color: #fff;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .language-btn {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

// Compact version for mobile/small spaces
export const CompactLanguageSwitcher: React.FC<Omit<LanguageSwitcherProps, 'showLabels'>> = ({ 
  className = '' 
}) => {
  return (
    <LanguageSwitcher 
      className={className} 
      showLabels={false}
    />
  );
};

// Dropdown version for more languages (future expansion)
export const DropdownLanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '' 
}) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ta' as const, name: 'தமிழ்', flag: '🇮🇳' },
  ];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as 'en' | 'ta');
  };

  return (
    <div className={`dropdown-language-switcher ${className}`}>
      <select 
        value={language} 
        onChange={handleChange}
        className="language-select"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      
      <style>{`
        .dropdown-language-switcher {
          display: flex;
          align-items: center;
        }

        .language-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          min-width: 120px;
        }

        .language-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
