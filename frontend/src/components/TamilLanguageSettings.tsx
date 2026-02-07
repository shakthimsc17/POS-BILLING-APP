import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TamilLanguageSettingsProps {
  onClose?: () => void;
}

export const TamilLanguageSettings: React.FC<TamilLanguageSettingsProps> = ({ onClose }) => {
  const { language, setLanguage } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const handleLanguageToggle = () => {
    const newLanguage = language === 'en' ? 'ta' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <div className="tamil-language-settings">
      <div className="settings-section">
        <h3>Tamil Language Support</h3>
        
        <div className="feature-description">
          <p>
            Enable Tamil language support for your POS system to serve Tamil-speaking customers better. 
            This feature allows you to:
          </p>
          <ul>
            <li>Print receipts in Tamil language</li>
            <li>Display Tamil item names on receipts</li>
            <li>Show Tamil headers and labels</li>
            <li>Better customer experience for Tamil speakers</li>
          </ul>
        </div>

        <div className="language-toggle-section">
          <div className="toggle-header">
            <h4>Current Language: {language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}</h4>
            <button 
              className="btn btn-info btn-sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="language-buttons">
            <button
              className={`language-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              🇬🇧 English
            </button>
            <button
              className={`language-btn ${language === 'ta' ? 'active' : ''}`}
              onClick={() => setLanguage('ta')}
            >
              🇮🇳 தமிழ்
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="details-section">
            <h4>📋 How to Use Tamil Printing</h4>
            
            <div className="detail-item">
              <h5>1. Add Tamil Item Names</h5>
              <p>Go to Items → Edit any item → Set "Display Name" in Tamil (e.g., "பால்" for Milk)</p>
            </div>

            <div className="detail-item">
              <h5>2. Set Company Details in Tamil</h5>
              <p>Go to Settings → Company Settings → Add Tamil company name and address</p>
            </div>

            <div className="detail-item">
              <h5>3. Switch to Tamil Mode</h5>
              <p>Click the Tamil button above to switch the entire system to Tamil</p>
            </div>

            <div className="detail-item">
              <h5>4. Print Receipts</h5>
              <p>Make a sale and print - receipts will appear in Tamil with proper fonts</p>
            </div>

            <div className="supported-fields">
              <h5>✅ Supported Tamil Fields:</h5>
              <div className="fields-grid">
                <div className="field-category">
                  <strong>Receipt Headers:</strong>
                  <ul>
                    <li>ரசீது (Receipt)</li>
                    <li>தேதி (Date)</li>
                    <li>நேரம் (Time)</li>
                    <li>வாடிக்கையாளர் (Customer)</li>
                  </ul>
                </div>
                <div className="field-category">
                  <strong>Item Details:</strong>
                  <ul>
                    <li>பொருள் (Item)</li>
                    <li>விலை (Rate)</li>
                    <li>எண்ணிக்கை (Quantity)</li>
                    <li>தொகை (Amount)</li>
                  </ul>
                </div>
                <div className="field-category">
                  <strong>Totals:</strong>
                  <ul>
                    <li>கூட்டுத்தொகை (Subtotal)</li>
                    <li>தள்ளுபடி (Discount)</li>
                    <li>மொத்தத் தொகை (Grand Total)</li>
                    <li>பெறப்பட்ட பணம் (Cash Received)</li>
                  </ul>
                </div>
                <div className="field-category">
                  <strong>Footer:</strong>
                  <ul>
                    <li>உங்கள் வணிகத்திற்கு நன்றி! (Thank You)</li>
                    <li>மீண்டும் வருகைத்தொடர்க (Visit Again)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="benefits-section">
              <h5>🎯 Business Benefits:</h5>
              <ul>
                <li><strong>40% Larger Market:</strong> Reach Tamil-speaking customers</li>
                <li><strong>Customer Trust:</strong> Native language builds confidence</li>
                <li><strong>Professional Image:</strong> Shows you care about local customers</li>
                <li><strong>Competitive Edge:</strong> Few competitors offer Tamil support</li>
              </ul>
            </div>

            <div className="technical-info">
              <h5>🔧 Technical Details:</h5>
              <ul>
                <li>Uses Tamil Sangam MN and Noto Sans Tamil fonts</li>
                <li>Optimized for thermal printer compatibility</li>
                <li>Supports GST compliance in Tamil</li>
                <li>Works with all receipt types (80mm thermal)</li>
              </ul>
            </div>
          </div>
        )}

        <div className="actions">
          <button 
            className="btn btn-primary"
            onClick={handleLanguageToggle}
          >
            Switch to {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
          
          {onClose && (
            <button 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        .tamil-language-settings {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settings-section h3 {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 18px;
        }

        .feature-description {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .feature-description p {
          margin-bottom: 10px;
          color: #475569;
        }

        .feature-description ul {
          margin: 0;
          padding-left: 20px;
          color: #64748b;
        }

        .feature-description li {
          margin-bottom: 5px;
        }

        .language-toggle-section {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .toggle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .toggle-header h4 {
          margin: 0;
          color: #1e293b;
        }

        .language-buttons {
          display: flex;
          gap: 10px;
        }

        .language-btn {
          flex: 1;
          padding: 12px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .language-btn:hover {
          border-color: #2563eb;
          background: #f0f9ff;
        }

        .language-btn.active {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .details-section {
          background: #f8fafc;
          border-radius: 6px;
          padding: 20px;
          margin-top: 20px;
        }

        .details-section h4 {
          color: #1e293b;
          margin-bottom: 15px;
        }

        .detail-item {
          margin-bottom: 15px;
        }

        .detail-item h5 {
          color: #2563eb;
          margin-bottom: 5px;
        }

        .detail-item p {
          color: #64748b;
          margin: 0;
        }

        .supported-fields {
          margin-top: 20px;
        }

        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }

        .field-category {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .field-category strong {
          color: #1e293b;
          display: block;
          margin-bottom: 5px;
        }

        .field-category ul {
          margin: 0;
          padding-left: 15px;
          color: #64748b;
        }

        .field-category li {
          margin-bottom: 3px;
          font-size: 14px;
        }

        .benefits-section {
          margin-top: 20px;
        }

        .benefits-section h5 {
          color: #059669;
          margin-bottom: 10px;
        }

        .benefits-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .benefits-section li {
          margin-bottom: 5px;
          color: #64748b;
        }

        .technical-info {
          margin-top: 20px;
        }

        .technical-info h5 {
          color: #7c3aed;
          margin-bottom: 10px;
        }

        .technical-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .technical-info li {
          margin-bottom: 5px;
          color: #64748b;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #64748b;
          color: white;
        }

        .btn-secondary:hover {
          background: #475569;
        }

        .btn-info {
          background: #0891b2;
          color: white;
        }

        .btn-info:hover {
          background: #0e7490;
        }
      `}</style>
    </div>
  );
};

export default TamilLanguageSettings;
