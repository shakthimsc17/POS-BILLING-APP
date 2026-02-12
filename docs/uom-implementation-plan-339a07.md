# UOM Implementation Plan for POS Billing System

This plan implements comprehensive Unit of Measure (UOM) functionality with standard units, conversion calculations, and database schema updates to support modern inventory management across all business types.

## Current Analysis

Based on the current Item schema, I've identified these missing fields needed for modern POS systems:
- No UOM field (unit of measure)
- Missing manufacturer/brand details
- No weight/volume specifications
- Limited stock tracking (only basic integer)
- No packaging information
- Missing shelf life/expiry tracking

## Proposed Database Schema Changes

### 1. New UOM Master Table
```sql
CREATE TABLE "uom_master" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL, -- e.g., "Pieces", "Kilograms", "Grams", "Liters", "Meters"
    "code" VARCHAR(10) NOT NULL, -- e.g., "PCS", "KG", "G", "L", "M"
    "category" VARCHAR(20) NOT NULL, -- "weight", "volume", "length", "pieces", "area"
    "base_uom_id" UUID, -- Reference to base UOM for conversions
    "conversion_factor" DECIMAL(10,6) DEFAULT 1.0, -- Conversion to base UOM
    "is_base_uom" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
```

### 2. Updated Items Table
```sql
ALTER TABLE "items" ADD COLUMN "uom_id" UUID REFERENCES "uom_master"("id");
ALTER TABLE "items" ADD COLUMN "weight_per_unit" DECIMAL(10,3); -- Weight in kg
ALTER TABLE "items" ADD COLUMN "volume_per_unit" DECIMAL(10,3); -- Volume in liters
ALTER TABLE "items" ADD COLUMN "length_per_unit" DECIMAL(10,3); -- Length in meters
ALTER TABLE "items" ADD COLUMN "width_per_unit" DECIMAL(10,3); -- Width in meters
ALTER TABLE "items" ADD COLUMN "height_per_unit" DECIMAL(10,3); -- Height in meters
ALTER TABLE "items" ADD COLUMN "manufacturer" VARCHAR(255);
ALTER TABLE "items" ADD COLUMN "brand" VARCHAR(255);
ALTER TABLE "items" ADD COLUMN "model_number" VARCHAR(100);
ALTER TABLE "items" ADD COLUMN "batch_number" VARCHAR(100);
ALTER TABLE "items" ADD COLUMN "expiry_date" DATE;
ALTER TABLE "items" ADD COLUMN "shelf_life_days" INTEGER;
ALTER TABLE "items" ADD COLUMN "min_stock_level" DECIMAL(10,2);
ALTER TABLE "items" ADD COLUMN "max_stock_level" DECIMAL(10,2);
ALTER TABLE "items" ADD COLUMN "reorder_level" DECIMAL(10,2);
ALTER TABLE "items" ADD COLUMN "package_type" VARCHAR(50); -- e.g., "Box", "Bag", "Bottle", "Packet"
ALTER TABLE "items" ADD COLUMN "package_quantity" INTEGER DEFAULT 1; -- Units per package
ALTER TABLE "items" ADD COLUMN "is_perishable" BOOLEAN DEFAULT false;
ALTER TABLE "items" ADD COLUMN "storage_conditions" VARCHAR(255); -- e.g., "Refrigerated", "Dry Storage"
```

### 3. UOM Conversion Table
```sql
CREATE TABLE "uom_conversions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "from_uom_id" UUID NOT NULL,
    "to_uom_id" UUID NOT NULL,
    "conversion_factor" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE("customer_id", "from_uom_id", "to_uom_id")
);
```

## Standard UOM Categories and Units

### Weight Units
- Kilograms (KG) - Base unit
- Grams (G) - 1 KG = 1000 G
- Milligrams (MG) - 1 KG = 1,000,000 MG
- Pounds (LB) - 1 KG = 2.20462 LB
- Ounces (OZ) - 1 KG = 35.274 OZ

### Volume Units  
- Liters (L) - Base unit
- Milliliters (ML) - 1 L = 1000 ML
- Gallons (GAL) - 1 L = 0.264172 GAL
- Fluid Ounces (FL OZ) - 1 L = 33.814 FL OZ

### Length Units
- Meters (M) - Base unit
- Centimeters (CM) - 1 M = 100 CM
- Millimeters (MM) - 1 M = 1000 MM
- Feet (FT) - 1 M = 3.28084 FT
- Inches (IN) - 1 M = 39.3701 IN

### Piece Units
- Pieces (PCS) - Base unit
- Dozens (DOZ) - 1 DOZ = 12 PCS
- Boxes (BOX) - Configurable quantity
- Packs (PACK) - Configurable quantity
- Sets (SET) - Configurable quantity

### Area Units
- Square Meters (M²) - Base unit
- Square Feet (FT²) - 1 M² = 10.7639 FT²
- Square Inches (IN²) - 1 M² = 1550 IN²

## Implementation Features

### 1. Frontend Changes
- **Add Item Page**: Add UOM selection dropdown with auto-conversion display
- **View Item Page**: Show UOM with conversion information
- **Item List**: Display stock with UOM (e.g., "100 KG" instead of "100")
- **Cart System**: Support mixed UOM items with proper calculations
- **Sales Process**: Show quantity in item's UOM with conversion options

### 2. Backend Changes
- **API Updates**: Add UOM endpoints for CRUD operations
- **Calculation Service**: UOM conversion engine for pricing and stock
- **Validation**: Ensure UOM consistency across transactions
- **Migration Scripts**: Database migration for existing items

### 3. Calculation Logic
- **Price Conversions**: Calculate price per base unit for comparison
- **Stock Calculations**: Convert stock levels between UOMs
- **GST Calculations**: Apply GST on converted base amounts
- **Reporting**: Show all quantities in base UOM with original UOM

### 4. Business Type Support
- **Cafe**: Focus on weight (grams, kg) and volume (ml, l) units
- **Clothing**: Focus on pieces and length units (meters, cm)
- **Electrical**: Focus on pieces, weight, and package units
- **General**: Support all UOM categories

## Migration Strategy

### Phase 1: Database Setup
1. Create UOM master table with standard units
2. Create UOM conversion table
3. Add new columns to items table
4. Migrate existing items (default to "Pieces" UOM)

### Phase 2: Backend Implementation
1. Update Item model and DTOs
2. Implement UOM service layer
3. Add conversion calculation utilities
4. Update API endpoints

### Phase 3: Frontend Integration
1. Update Add/View item forms
2. Implement UOM selection components
3. Update cart and sales interfaces
4. Add UOM display in item lists

## Benefits
- **Standardization**: Consistent unit management across all items
- **Flexibility**: Support for mixed UOM transactions
- **Accuracy**: Precise conversions for pricing and inventory
- **Scalability**: Easy to add new UOM types
- **Compliance**: Proper weight/volume tracking for regulations
- **User Experience**: Intuitive unit selection with auto-conversions

This implementation ensures the POS system can handle modern inventory requirements while maintaining backward compatibility with existing data.
