import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCompanyStore } from '../store/companyStore';
import { Category, ItemCodePrefix, UomMaster } from '../types';
import { storageService } from '../services/storage';
import { uomService } from '../services/uomService';
import './AddItemMultiStage.css';

interface AddItemMultiStageProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

export default function AddItemMultiStage({ onNavigate, onBack }: AddItemMultiStageProps = {}) {
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const totalStages = 5;

  // Basic Information - Stage 1
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState<'goods' | 'service'>('goods');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');

  // Item Code & Identification - Stage 2
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [mappingCode, setMappingCode] = useState('');
  const [hsnCode, setHsnCode] = useState('');

  // Pricing & GST - Stage 3
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [cessRate, setCessRate] = useState('');
  const [gstMandatory, setGstMandatory] = useState(false);

  // UOM & Dimensions - Stage 4
  const [uoms, setUoms] = useState<UomMaster[]>([]);
  const [uomId, setUomId] = useState('');
  const [weightPerUnit, setWeightPerUnit] = useState('');
  const [volumePerUnit, setVolumePerUnit] = useState('');
  const [lengthPerUnit, setLengthPerUnit] = useState('');
  const [widthPerUnit, setWidthPerUnit] = useState('');
  const [heightPerUnit, setHeightPerUnit] = useState('');

  // Additional Details - Stage 5
  const [modelNumber, setModelNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [maxStockLevel, setMaxStockLevel] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [packageType, setPackageType] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('1');
  const [isPerishable, setIsPerishable] = useState(false);
  const [storageConditions, setStorageConditions] = useState('');

  // Brand and Manufacturer
  const [brands, setBrands] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [manufacturerSearchTerm, setManufacturerSearchTerm] = useState('');

  // Stock
  const [stock, setStock] = useState('0');
  const [openingStock, setOpeningStock] = useState('0');

  // Item code prefix states
  const [prefixes, setPrefixes] = useState<ItemCodePrefix[]>([]);
  const [selectedPrefixId, setSelectedPrefixId] = useState('');
  const [productCodeSize, setProductCodeSize] = useState('');
  const [useManualCode, setUseManualCode] = useState(false);

  const { categories, addItem } = useInventoryStore();
  const { company } = useCompanyStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCategories(),
        loadPrefixes(),
        loadUoms(),
        loadBrands(),
        loadSuppliers(),
      ]);
    };
    loadData();
  }, []);

  const loadCategories = async () => {
    try {
      await useInventoryStore.getState().loadCategories(true);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPrefixes = async () => {
    try {
      const data = await storageService.getItemCodePrefixes();
      setPrefixes(data);
    } catch (error) {
      console.error('Error loading prefixes:', error);
    }
  };

  const loadUoms = async () => {
    try {
      const data = await uomService.getUoms();
      setUoms(data);
      // Set default UOM if available (e.g. PCS)
      const pcs = data.find(u => u.code === 'PCS' || u.name === 'Pieces');
      if (pcs) setUomId(pcs.id);
      else if (data.length > 0) setUomId(data[0].id);
    } catch (error) {
      console.error('Error loading UOMs:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await fetch('/api/brands', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Auto-fill barcode when product code and size are entered
  useEffect(() => {
    if (!useManualCode && productCodeSize && selectedPrefixId) {
      const selectedPrefix = prefixes.find(p => p.id === selectedPrefixId);
      if (selectedPrefix) {
        const fullBarcode = `${selectedPrefix.prefix}${productCodeSize}`;
        setBarcode(fullBarcode);
        setCode(fullBarcode);
        setSku(fullBarcode);
      }
    }
  }, [productCodeSize, selectedPrefixId, prefixes, useManualCode]);

  // Auto-populate display_name when name is typed
  useEffect(() => {
    if (name && !displayName) {
      setDisplayName(name);
    }
  }, [name, displayName]);

  // Get unique subcategories for selected category
  const getSubcategories = () => {
    if (!categoryId) return [];
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (!selectedCategory) return [];
    const subcats = categories
      .filter(c => c.name === selectedCategory.name && c.subcategory)
      .map(c => c.subcategory)
      .filter((sub): sub is string => !!sub);
    return [...new Set(subcats)];
  };

  // Get unique main category names
  const getUniqueMainCategories = () => {
    if (!categories || categories.length === 0) {
      return [];
    }
    const mainCategoryNames = [...new Set(categories.map(c => c.name))];
    return mainCategoryNames.map(name => {
      return categories.find(c => c.name === name && !c.subcategory) ||
        categories.find(c => c.name === name);
    }).filter((cat): cat is Category => !!cat);
  };

  const validateStage = (stage: number): boolean => {
    switch (stage) {
      case 1:
        return name.trim() !== '' && uomId !== '';
      case 2:
        return code.trim() !== '';
      case 3:
        return cost !== '' && price !== '' && parseFloat(cost) >= 0 && parseFloat(price) >= 0;
      case 4:
        return true; // UOM & Dimensions are mostly optional
      case 5:
        return true; // Additional details are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStage(currentStage)) {
      if (currentStage < totalStages) {
        setCurrentStage(currentStage + 1);
      }
    } else {
      alert('Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStage(currentStage)) {
      alert('Please fill in all required fields before submitting.');
      return;
    }

    setLoading(true);

    try {
      // GST validation if mandatory
      if (gstMandatory) {
        if (!gstRate || parseFloat(gstRate) < 0) {
          alert('GST Rate is required when GST is mandatory');
          return;
        }
        if (!hsnCode.trim()) {
          alert('HSN Code is required when GST is mandatory');
          return;
        }
      }

      let finalCode = code.trim();

      // Handle prefix logic for non-cafe businesses
      if (company.business_type !== 'cafe') {
        if (useManualCode && code.trim()) {
          // Auto-create prefix if needed (similar logic from Items.tsx)
          const matchingPrefix = prefixes.find(p => finalCode.startsWith(p.prefix));

          if (!matchingPrefix) {
            const separators = /[-_]/;
            const lastSeparatorIndex = finalCode.search(separators);

            if (lastSeparatorIndex > 0) {
              let lastIndex = -1;
              for (let i = finalCode.length - 1; i >= 0; i--) {
                if (finalCode[i] === '-' || finalCode[i] === '_') {
                  lastIndex = i;
                  break;
                }
              }

              if (lastIndex > 0) {
                const potentialPrefix = finalCode.substring(0, lastIndex + 1);
                const existingPrefix = prefixes.find(p => p.prefix === potentialPrefix);

                if (!existingPrefix && potentialPrefix.length > 0) {
                  try {
                    await storageService.addItemCodePrefix({
                      prefix: potentialPrefix,
                      description: 'Auto-created from item code',
                    });
                    await loadPrefixes();
                  } catch (error: any) {
                    console.log('Prefix might already exist:', error);
                  }
                }
              }
            }
          }
        }
      }

      // Prepare item data
      const itemData: any = {
        name,
        display_name: displayName || undefined,
        code: finalCode,
        barcode: barcode || undefined,
        mapping_code: mappingCode.trim() || undefined,
        category_id: company.business_type === 'cafe' ? undefined : (categoryId || undefined),
        subcategory: company.business_type === 'cafe' ? undefined : (subcategory || undefined),
        cost: Number(cost),
        price: Number(price),
        mrp: mrp ? Number(mrp) : undefined,
        stock: Number(openingStock || stock),
        hsn_code: hsnCode.trim() || undefined,
        gst_rate: gstRate ? Number(gstRate) : undefined,
        cess_rate: cessRate ? Number(cessRate) : undefined,

        // Extended Fields
        uom_id: uomId || undefined,
        weight_per_unit: weightPerUnit ? Number(weightPerUnit) : undefined,
        volume_per_unit: volumePerUnit ? Number(volumePerUnit) : undefined,
        length_per_unit: lengthPerUnit ? Number(lengthPerUnit) : undefined,
        width_per_unit: widthPerUnit ? Number(widthPerUnit) : undefined,
        height_per_unit: heightPerUnit ? Number(heightPerUnit) : undefined,
        // Brand and Manufacturer
        brand_id: brandId || undefined,
        supplier_id: supplierId || undefined,
        manufacturer: supplierId ? suppliers.find(s => s.id === supplierId)?.name || manufacturerSearchTerm.trim() : (manufacturerSearchTerm.trim() || undefined),
        model_number: modelNumber.trim() || undefined,
        batch_number: batchNumber.trim() || undefined,
        expiry_date: expiryDate || undefined,
        shelf_life_days: shelfLifeDays ? Number(shelfLifeDays) : undefined,
        min_stock_level: minStockLevel ? Number(minStockLevel) : undefined,
        max_stock_level: maxStockLevel ? Number(maxStockLevel) : undefined,
        reorder_level: reorderLevel ? Number(reorderLevel) : undefined,
        package_type: packageType.trim() || undefined,
        package_quantity: packageQuantity ? Number(packageQuantity) : 1,
        is_perishable: isPerishable,
        storage_conditions: storageConditions.trim() || undefined,
      };

      await addItem(itemData);

      // Show success message
      const notification = document.createElement('div');
      notification.className = 'notification success';
      notification.textContent = 'Item added successfully!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      // Navigate back to items list
      if (onNavigate) {
        onNavigate('items');
      } else if (onBack) {
        onBack();
      }
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(`Failed to add item: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('items');
    } else if (onBack) {
      onBack();
    }
  };

  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return (
          <div className="stage-content">
            <h2>Basic Information</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Item Name<span className="required-asterisk">*</span>:
                  <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  Item Code<span className="required-asterisk">*</span>:
                  <input
                    type="text"
                    className="input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter item code"
                    required
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  Type<span className="required-asterisk">*</span>:
                  <select
                    className="input"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'goods' | 'service')}
                  >
                    <option value="goods">Goods</option>
                    <option value="service">Service</option>
                  </select>
                </label>
              </div>

              <div className="form-field">
                <label>
                  UOM (Unit of Measure)<span className="required-asterisk">*</span>:
                  <select
                    className="input"
                    value={uomId}
                    onChange={(e) => setUomId(e.target.value)}
                    required
                  >
                    <option value="">Select UOM</option>
                    {uoms.map(uom => (
                      <option key={uom.id} value={uom.id}>{uom.name} ({uom.code})</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-field">
                <label>
                  Category:
                  <select
                    className="input"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubcategory('');
                    }}
                  >
                    <option value="">Select Category</option>
                    {getUniqueMainCategories().map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {categoryId && getSubcategories().length > 0 && (
                <div className="form-field">
                  <label>
                    Subcategory:
                    <select
                      className="input"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                    >
                      <option value="">Select Subcategory</option>
                      {getSubcategories().map((subcat, idx) => (
                        <option key={idx} value={subcat}>
                          {subcat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div className="form-field">
                <label>
                  Brand:
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      className="input"
                      value={brandSearchTerm}
                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                      placeholder="Search or select brand"
                    />
                    {brandSearchTerm && (
                      <div className="dropdown-options">
                        {brands
                          .filter(brand => brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase()))
                          .map(brand => (
                            <div
                              key={brand.id}
                              className="dropdown-option"
                              onClick={() => {
                                setBrandId(brand.id);
                                setBrandSearchTerm(brand.name);
                              }}
                            >
                              {brand.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="form-field">
                <label>
                  Manufacturer:
                  <div className="searchable-dropdown">
                    <input
                      type="text"
                      className="input"
                      value={manufacturerSearchTerm}
                      onChange={(e) => setManufacturerSearchTerm(e.target.value)}
                      placeholder="Search or select manufacturer"
                    />
                    {manufacturerSearchTerm && (
                      <div className="dropdown-options">
                        {suppliers
                          .filter(supplier => supplier.name.toLowerCase().includes(manufacturerSearchTerm.toLowerCase()))
                          .map(supplier => (
                            <div
                              key={supplier.id}
                              className="dropdown-option"
                              onClick={() => {
                                setSupplierId(supplier.id);
                                setManufacturerSearchTerm(supplier.name);
                              }}
                            >
                              {supplier.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="form-field">
                <label>
                  SKU:
                  <input
                    type="text"
                    className="input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Stock Keeping Unit"
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  Display Name:
                  <input
                    type="text"
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                  />
                </label>
              </div>

              <div className="form-field full-width">
                <label>
                  Description:
                  <textarea
                    className="input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter item description"
                    rows={3}
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="stage-content">
            <h2>Item Code & Identification</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Barcode:
                  <input
                    type="text"
                    className="input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter barcode"
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  Mapping Code (for Quick Search):
                  <input
                    type="text"
                    className="input"
                    value={mappingCode}
                    onChange={(e) => setMappingCode(e.target.value)}
                    placeholder="e.g., 1, 2, 3..."
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  HSN Code:
                  <input
                    type="text"
                    className="input"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g., 847120"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="stage-content">
            <h2>Pricing & GST</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Cost Price<span className="required-asterisk">*</span>:
                  <input
                    type="number"
                    className="input"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  Selling Price<span className="required-asterisk">*</span>:
                  <input
                    type="number"
                    className="input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  MRP:
                  <input
                    type="number"
                    className="input"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Maximum Retail Price"
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  GST Rate (%):
                  <input
                    type="number"
                    className="input"
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    placeholder="e.g., 5, 12, 18"
                    step="0.01"
                    min="0"
                  />
                </label>
              </div>

              <div className="form-field">
                <label>
                  CESS Rate (%):
                  <input
                    type="number"
                    className="input"
                    value={cessRate}
                    onChange={(e) => setCessRate(e.target.value)}
                    placeholder="e.g., 1, 2"
                    step="0.01"
                    min="0"
                  />
                </label>
              </div>

              <div className="form-field">
                <label style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={gstMandatory}
                    onChange={(e) => setGstMandatory(e.target.checked)}
                  />
                  GST Mandatory
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="stage-content">
            <h2>UOM & Dimensions</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Weight per Unit:</label>
                <input type="number" className="input" value={weightPerUnit} onChange={e => setWeightPerUnit(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="form-field">
                <label>Volume per Unit:</label>
                <input type="number" className="input" value={volumePerUnit} onChange={e => setVolumePerUnit(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="form-field">
                <label>Length:</label>
                <input type="number" className="input" value={lengthPerUnit} onChange={e => setLengthPerUnit(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="form-field">
                <label>Width:</label>
                <input type="number" className="input" value={widthPerUnit} onChange={e => setWidthPerUnit(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="form-field">
                <label>Height:</label>
                <input type="number" className="input" value={heightPerUnit} onChange={e => setHeightPerUnit(e.target.value)} placeholder="0.00" step="0.01" />
              </div>
              <div className="form-field">
                <label>Package Type:</label>
                <input type="text" className="input" value={packageType} onChange={e => setPackageType(e.target.value)} placeholder="e.g. Box, Bottle" />
              </div>
              <div className="form-field">
                <label>Package Quantity:</label>
                <input type="number" className="input" value={packageQuantity} onChange={e => setPackageQuantity(e.target.value)} placeholder="1" min="1" />
              </div>
              <div className="form-field">
                <label style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                  <input type="checkbox" checked={isPerishable} onChange={e => setIsPerishable(e.target.checked)} />
                  Is Perishable
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="stage-content">
            <h2>Additional Details</h2>
            <div className="form-grid">
              <div className="form-field">
                <label>Model Number:</label>
                <input type="text" className="input" value={modelNumber} onChange={e => setModelNumber(e.target.value)} placeholder="Model No." />
              </div>
              <div className="form-field">
                <label>Batch Number:</label>
                <input type="text" className="input" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="Batch No." />
              </div>
              <div className="form-field">
                <label>Expiry Date:</label>
                <input type="date" className="input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Shelf Life (Days):</label>
                <input type="number" className="input" value={shelfLifeDays} onChange={e => setShelfLifeDays(e.target.value)} placeholder="Days" />
              </div>
              <div className="form-field">
                <label>Min Stock Level:</label>
                <input type="number" className="input" value={minStockLevel} onChange={e => setMinStockLevel(e.target.value)} placeholder="0" />
              </div>
              <div className="form-field">
                <label>Max Stock Level:</label>
                <input type="number" className="input" value={maxStockLevel} onChange={e => setMaxStockLevel(e.target.value)} placeholder="0" />
              </div>
              <div className="form-field">
                <label>Reorder Level:</label>
                <input type="number" className="input" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} placeholder="0" />
              </div>
              <div className="form-field full-width">
                <label>Storage Conditions:</label>
                <input type="text" className="input" value={storageConditions} onChange={e => setStorageConditions(e.target.value)} placeholder="e.g. Store in cool dry place" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="add-item-multistage-page">
      <div className="page-header">
        <div className="header-content">
          <button className="btn btn-secondary back-btn" onClick={handleCancel}>
            ← Back to Items
          </button>
          <h1>Add New Item</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-item-multistage-form">
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStage - 1) / (totalStages - 1)) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {['Basic Info', 'Item Code', 'Pricing', 'UOM & Dimensions', 'Additional Details'].map((step, index) => (
              <div 
                key={index} 
                className={`progress-step ${currentStage === index + 1 ? 'active' : ''} ${currentStage > index + 1 ? 'completed' : ''}`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="form-container">
          {renderStage()}
        </div>

        {/* Navigation Buttons */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          
          <div className="navigation-buttons">
            {currentStage > 1 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handlePrevious}
              >
                ← Back
              </button>
            )}
            
            {currentStage < totalStages ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleNext}
              >
                Next →
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
