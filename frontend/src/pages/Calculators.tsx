import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import './Calculators.css';

type CalculatorType = 'discount' | 'gm' | 'markup' | 'break-even' | 'margin';

export default function Calculators() {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>('discount');

  // Discount Calculator
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  // GM Calculator
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Markup Calculator
  const [markupCost, setMarkupCost] = useState('');
  const [markupPercent, setMarkupPercent] = useState('');

  // Break-even Calculator
  const [fixedCosts, setFixedCosts] = useState('');
  const [variableCost, setVariableCost] = useState('');
  const [sellingPriceBE, setSellingPriceBE] = useState('');

  // Margin Calculator
  const [marginCost, setMarginCost] = useState('');
  const [marginPercent, setMarginPercent] = useState('');

  const calculateDiscount = () => {
    if (!originalPrice || !discountPercent) return null;
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercent);
    const discountAmt = (price * discount) / 100;
    const finalPrice = price - discountAmt;
    return { discountAmt, finalPrice };
  };

  const calculateGM = () => {
    if (!costPrice || !sellingPrice) return null;
    const cost = parseFloat(costPrice);
    const selling = parseFloat(sellingPrice);
    if (selling === 0) return null;
    const profit = selling - cost;
    const gmPercent = (profit / selling) * 100;
    const markupPercent = (profit / cost) * 100;
    return { profit, gmPercent, markupPercent };
  };

  const calculateMarkup = () => {
    if (!markupCost || !markupPercent) return null;
    const cost = parseFloat(markupCost);
    const markup = parseFloat(markupPercent);
    const markupAmount = (cost * markup) / 100;
    const sellingPrice = cost + markupAmount;
    return { markupAmount, sellingPrice };
  };

  const calculateBreakEven = () => {
    if (!fixedCosts || !variableCost || !sellingPriceBE) return null;
    const fixed = parseFloat(fixedCosts);
    const variable = parseFloat(variableCost);
    const selling = parseFloat(sellingPriceBE);
    const contributionMargin = selling - variable;
    if (contributionMargin <= 0) return null;
    const breakEvenUnits = fixed / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * selling;
    return { breakEvenUnits, breakEvenRevenue };
  };

  const calculateMargin = () => {
    if (!marginCost || !marginPercent) return null;
    const cost = parseFloat(marginCost);
    const margin = parseFloat(marginPercent);
    // Margin = (Selling - Cost) / Selling * 100
    // So: Selling = Cost / (1 - margin/100)
    const sellingPrice = cost / (1 - margin / 100);
    const profit = sellingPrice - cost;
    return { sellingPrice, profit };
  };

  const discountResult = calculateDiscount();
  const gmResult = calculateGM();
  const markupResult = calculateMarkup();
  const breakEvenResult = calculateBreakEven();
  const marginResult = calculateMargin();

  const resetForm = () => {
    setOriginalPrice('');
    setDiscountPercent('');
    setDiscountAmount('');
    setCostPrice('');
    setSellingPrice('');
    setMarkupCost('');
    setMarkupPercent('');
    setFixedCosts('');
    setVariableCost('');
    setSellingPriceBE('');
    setMarginCost('');
    setMarginPercent('');
  };

  return (
    <div className="calculators-page">
      <div className="calculators-header">
        <h1>🧮 Business Calculators</h1>
        <button className="btn btn-secondary" onClick={resetForm}>
          Reset All
        </button>
      </div>

      <div className="calculator-selector">
        <label>Select Calculator:</label>
        <select
          className="input"
          value={calculatorType}
          onChange={(e) => {
            setCalculatorType(e.target.value as CalculatorType);
            resetForm();
          }}
        >
          <option value="discount">Discount Calculator</option>
          <option value="gm">Gross Margin Calculator</option>
          <option value="markup">Markup Calculator</option>
          <option value="break-even">Break-Even Calculator</option>
          <option value="margin">Margin Calculator</option>
        </select>
      </div>

      <div className="calculator-container">
        {/* Discount Calculator */}
        {calculatorType === 'discount' && (
          <div className="calculator-card">
            <h2>💰 Discount Calculator</h2>
            <div className="info-section">
              <p className="calculator-description">
                <strong>What it does:</strong> Calculate the discount amount and final price after applying a percentage discount.
              </p>
              <p className="calculator-description">
                <strong>When to use:</strong> Running sales, offering discounts to customers, or calculating final prices after promotions.
              </p>
              <div className="example-box">
                <strong>📝 Example:</strong>
                <p>An item costs ₹1,000 and you want to offer a 25% discount:</p>
                <ul>
                  <li>Original Price: ₹1,000</li>
                  <li>Discount (25%): ₹1,000 × 25% = ₹250</li>
                  <li>Final Price: ₹1,000 - ₹250 = ₹750</li>
                </ul>
                <button 
                  className="btn-example"
                  onClick={() => {
                    setOriginalPrice('1000');
                    setDiscountPercent('25');
                  }}
                >
                  Load This Example
                </button>
              </div>
            </div>
            <div className="calculator-form">
              <label>
                Original Price (₹):
                <input
                  type="number"
                  className="input"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Enter original price"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Discount Percentage (%):
                <input
                  type="number"
                  className="input"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="Enter discount %"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </label>
              {discountResult && (
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Discount Amount:</span>
                    <span className="result-value discount">
                      {formatCurrency(discountResult.discountAmt)}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Final Price:</span>
                    <span className="result-value final">
                      {formatCurrency(discountResult.finalPrice)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gross Margin Calculator */}
        {calculatorType === 'gm' && (
          <div className="calculator-card">
            <h2>📊 Gross Margin Calculator</h2>
            <div className="info-section">
              <p className="calculator-description">
                <strong>What it does:</strong> Calculate gross margin percentage, profit, and markup based on cost and selling price.
              </p>
              <p className="calculator-description">
                <strong>When to use:</strong> Analyzing profitability of items, comparing margins across products, or understanding pricing efficiency.
              </p>
              <div className="example-box">
                <strong>📝 Example:</strong>
                <p>You buy a shirt for ₹300 and sell it for ₹500:</p>
                <ul>
                  <li>Cost Price: ₹300</li>
                  <li>Selling Price: ₹500</li>
                  <li>Profit: ₹200</li>
                  <li>Gross Margin: 40% (₹200 ÷ ₹500)</li>
                  <li>Markup: 66.67% (₹200 ÷ ₹300)</li>
                </ul>
                <button 
                  className="btn-example"
                  onClick={() => {
                    setCostPrice('300');
                    setSellingPrice('500');
                  }}
                >
                  Load This Example
                </button>
              </div>
              <div className="formula-box">
                <strong>Formula:</strong> Gross Margin = (Selling Price - Cost) ÷ Selling Price × 100
                <br />
                <small>Markup = (Selling Price - Cost) ÷ Cost × 100</small>
              </div>
            </div>
            <div className="calculator-form">
              <label>
                Cost Price (₹):
                <input
                  type="number"
                  className="input"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Enter cost price"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Selling Price (₹):
                <input
                  type="number"
                  className="input"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="Enter selling price"
                  step="0.01"
                  min="0"
                />
              </label>
              {gmResult && (
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Profit:</span>
                    <span className={`result-value ${gmResult.profit >= 0 ? 'profit' : 'loss'}`}>
                      {formatCurrency(gmResult.profit)}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Gross Margin:</span>
                    <span className={`result-value ${gmResult.gmPercent >= 30 ? 'gm-high' : gmResult.gmPercent >= 15 ? 'gm-medium' : 'gm-low'}`}>
                      {gmResult.gmPercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Markup:</span>
                    <span className="result-value">
                      {gmResult.markupPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Markup Calculator */}
        {calculatorType === 'markup' && (
          <div className="calculator-card">
            <h2>📈 Markup Calculator</h2>
            <div className="info-section">
              <p className="calculator-description">
                <strong>What it does:</strong> Calculate selling price when you know the cost and want to add a markup percentage on top of it.
              </p>
              <p className="calculator-description">
                <strong>When to use:</strong> Setting prices for new items, applying consistent markup across categories, or quick pricing decisions.
              </p>
              <div className="example-box">
                <strong>📝 Example:</strong>
                <p>You buy a T-shirt for ₹200 and want a 60% markup:</p>
                <ul>
                  <li>Cost Price: ₹200</li>
                  <li>Markup (60%): ₹200 × 60% = ₹120</li>
                  <li>Selling Price: ₹200 + ₹120 = ₹320</li>
                </ul>
                <button 
                  className="btn-example"
                  onClick={() => {
                    setMarkupCost('200');
                    setMarkupPercent('60');
                  }}
                >
                  Load This Example
                </button>
              </div>
              <div className="formula-box">
                <strong>Formula:</strong> Selling Price = Cost + (Cost × Markup%)
              </div>
            </div>
            <div className="calculator-form">
              <label>
                Cost Price (₹):
                <input
                  type="number"
                  className="input"
                  value={markupCost}
                  onChange={(e) => setMarkupCost(e.target.value)}
                  placeholder="Enter cost price"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Markup Percentage (%):
                <input
                  type="number"
                  className="input"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                  placeholder="Enter markup %"
                  step="0.01"
                  min="0"
                />
              </label>
              {markupResult && (
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Markup Amount:</span>
                    <span className="result-value">
                      {formatCurrency(markupResult.markupAmount)}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Selling Price:</span>
                    <span className="result-value final">
                      {formatCurrency(markupResult.sellingPrice)}
                    </span>
                  </div>
                  <div className="calculation-breakdown">
                    <strong>Calculation:</strong>
                    <p>₹{markupCost} + (₹{markupCost} × {markupPercent}%) = ₹{markupCost} + ₹{markupResult.markupAmount.toFixed(2)} = ₹{markupResult.sellingPrice.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Break-Even Calculator */}
        {calculatorType === 'break-even' && (
          <div className="calculator-card">
            <h2>⚖️ Break-Even Calculator</h2>
            <div className="info-section">
              <p className="calculator-description">
                <strong>What it does:</strong> Calculate how many units you need to sell to cover all costs (no profit, no loss).
              </p>
              <p className="calculator-description">
                <strong>When to use:</strong> Planning new product launches, understanding minimum sales targets, or evaluating product viability.
              </p>
              <div className="example-box">
                <strong>📝 Example - Clothing Store:</strong>
                <p>You open a clothing store with:</p>
                <ul>
                  <li><strong>Fixed Costs:</strong> ₹1,00,000/month (rent, staff, utilities)</li>
                  <li><strong>Variable Cost:</strong> ₹200/item (materials, packaging)</li>
                  <li><strong>Selling Price:</strong> ₹500/item</li>
                </ul>
                <p><strong>Result:</strong> You need to sell 334 units (₹1,67,000 revenue) per month to break even.</p>
                <button 
                  className="btn-example"
                  onClick={() => {
                    setFixedCosts('100000');
                    setVariableCost('200');
                    setSellingPriceBE('500');
                  }}
                >
                  Load This Example
                </button>
              </div>
              <div className="formula-box">
                <strong>Formula:</strong> Break-Even Units = Fixed Costs ÷ (Selling Price - Variable Cost)
                <br />
                <small>Contribution Margin = Selling Price - Variable Cost (profit per unit after variable costs)</small>
              </div>
            </div>
            <div className="calculator-form">
              <label>
                Fixed Costs (₹):
                <span className="field-help">Monthly/period costs that don't change: rent, salaries, utilities, insurance</span>
                <input
                  type="number"
                  className="input"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(e.target.value)}
                  placeholder="Enter fixed costs"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Variable Cost per Unit (₹):
                <span className="field-help">Cost per item: materials, packaging, shipping per unit</span>
                <input
                  type="number"
                  className="input"
                  value={variableCost}
                  onChange={(e) => setVariableCost(e.target.value)}
                  placeholder="Enter variable cost per unit"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Selling Price per Unit (₹):
                <span className="field-help">Price you sell each item for</span>
                <input
                  type="number"
                  className="input"
                  value={sellingPriceBE}
                  onChange={(e) => setSellingPriceBE(e.target.value)}
                  placeholder="Enter selling price per unit"
                  step="0.01"
                  min="0"
                />
              </label>
              {breakEvenResult && (
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Contribution Margin per Unit:</span>
                    <span className="result-value">
                      {formatCurrency(parseFloat(sellingPriceBE) - parseFloat(variableCost))}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Break-Even Units:</span>
                    <span className="result-value">
                      {Math.ceil(breakEvenResult.breakEvenUnits)} units
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Break-Even Revenue:</span>
                    <span className="result-value final">
                      {formatCurrency(breakEvenResult.breakEvenRevenue)}
                    </span>
                  </div>
                  <div className="calculation-breakdown">
                    <strong>Calculation:</strong>
                    <p>Contribution Margin = ₹{sellingPriceBE} - ₹{variableCost} = ₹{(parseFloat(sellingPriceBE) - parseFloat(variableCost)).toFixed(2)}</p>
                    <p>Break-Even Units = ₹{fixedCosts} ÷ ₹{(parseFloat(sellingPriceBE) - parseFloat(variableCost)).toFixed(2)} = {breakEvenResult.breakEvenUnits.toFixed(2)} units</p>
                    <p>Break-Even Revenue = {Math.ceil(breakEvenResult.breakEvenUnits)} units × ₹{sellingPriceBE} = ₹{breakEvenResult.breakEvenRevenue.toFixed(2)}</p>
                  </div>
                  <div className="insight-box">
                    <strong>💡 Insight:</strong>
                    <p>You need to sell at least <strong>{Math.ceil(breakEvenResult.breakEvenUnits)} units</strong> to cover all costs. 
                    Every unit sold after this point contributes ₹{(parseFloat(sellingPriceBE) - parseFloat(variableCost)).toFixed(2)} to your profit!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Margin Calculator */}
        {calculatorType === 'margin' && (
          <div className="calculator-card">
            <h2>💹 Margin Calculator</h2>
            <div className="info-section">
              <p className="calculator-description">
                <strong>What it does:</strong> Calculate selling price based on cost price and desired margin percentage.
              </p>
              <p className="calculator-description">
                <strong>When to use:</strong> When you want a specific profit margin percentage (not markup). Margin is calculated on selling price, while markup is on cost.
              </p>
              <div className="example-box">
                <strong>📝 Example:</strong>
                <p>You buy an item for ₹400 and want a 30% margin:</p>
                <ul>
                  <li>Cost Price: ₹400</li>
                  <li>Desired Margin: 30%</li>
                  <li>Selling Price: ₹400 ÷ (1 - 30%) = ₹571.43</li>
                  <li>Profit: ₹171.43</li>
                </ul>
                <button 
                  className="btn-example"
                  onClick={() => {
                    setMarginCost('400');
                    setMarginPercent('30');
                  }}
                >
                  Load This Example
                </button>
              </div>
              <div className="formula-box">
                <strong>Formula:</strong> Selling Price = Cost ÷ (1 - Margin%)
                <br />
                <small>Note: Margin is calculated on selling price, while markup is calculated on cost price.</small>
              </div>
            </div>
            <div className="calculator-form">
              <label>
                Cost Price (₹):
                <input
                  type="number"
                  className="input"
                  value={marginCost}
                  onChange={(e) => setMarginCost(e.target.value)}
                  placeholder="Enter cost price"
                  step="0.01"
                  min="0"
                />
              </label>
              <label>
                Desired Margin (%):
                <input
                  type="number"
                  className="input"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(e.target.value)}
                  placeholder="Enter desired margin %"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </label>
              {marginResult && (
                <div className="calculator-result">
                  <div className="result-item">
                    <span className="result-label">Selling Price:</span>
                    <span className="result-value final">
                      {formatCurrency(marginResult.sellingPrice)}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Profit:</span>
                    <span className="result-value profit">
                      {formatCurrency(marginResult.profit)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

