import { Item } from '../types';
import { formatCurrency } from '../utils/formatters';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
  onPress: (item: Item) => void;
}

export default function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <div className="item-card" onClick={() => onPress(item)}>
      <div className="item-card-header">
        <div className="item-icon">📦</div>
        <div className="item-info">
          <h3>{item.name}</h3>
          <p className="item-code">Code: {item.code}</p>
        </div>
      </div>
      <div className="item-card-body">
        <div className="item-price">
          {(() => {
            // Convert to numbers (Prisma Decimal returns as string)
            const mrp = item.mrp ? (typeof item.mrp === 'string' ? parseFloat(item.mrp) : item.mrp) : null;
            const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            
            if (mrp && mrp > price) {
              return (
                <>
                  <div className="price-row">
                    <span className="mrp-price">{formatCurrency(mrp)}</span>
                    <span className="sale-price">{formatCurrency(price)}</span>
                  </div>
                  <div className="discount-badge">
                    Save {formatCurrency(mrp - price)}
                  </div>
                </>
              );
            }
            return <span className="price-value">{formatCurrency(price)}</span>;
          })()}
        </div>
        {item.stock > 0 ? (
          <div className="item-stock">Stock: {item.stock}</div>
        ) : (
          <div className="item-stock out-of-stock">Out of Stock</div>
        )}
      </div>
      <button className="item-add-btn">+ Add to Cart</button>
    </div>
  );
}

