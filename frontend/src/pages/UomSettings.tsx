import { useState, useEffect } from 'react';
import { uomService } from '../services/uomService';
import { UomMaster, UomConversion } from '../types';
import './UomSettings.css';

export default function UomSettings() {
    const [uoms, setUoms] = useState<UomMaster[]>([]);
    const [conversions, setConversions] = useState<UomConversion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isUomModalOpen, setIsUomModalOpen] = useState(false);
    const [editingUom, setEditingUom] = useState<UomMaster | null>(null);

    // UOM Form State
    const [uomName, setUomName] = useState('');
    const [uomCode, setUomCode] = useState('');
    const [uomCategory, setUomCategory] = useState('Unit'); // Default category
    const [isBaseUom, setIsBaseUom] = useState(true);
    const [baseUomId, setBaseUomId] = useState('');
    const [conversionFactor, setConversionFactor] = useState('1.0');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [uomsData, conversionsData] = await Promise.all([
                uomService.getUoms(),
                uomService.getConversions()
            ]);
            setUoms(uomsData);
            setConversions(conversionsData);
        } catch (err: any) {
            setError(err.message || 'Failed to load UOM data');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUom = (uom: UomMaster) => {
        setEditingUom(uom);
        setUomName(uom.name);
        setUomCode(uom.code);
        setUomCategory(uom.category);
        setIsBaseUom(uom.is_base_uom);
        setBaseUomId(uom.base_uom_id || '');
        setConversionFactor(uom.conversion_factor?.toString() || '1.0');
        setIsUomModalOpen(true);
    };

    const handleAddUom = () => {
        setEditingUom(null);
        setUomName('');
        setUomCode('');
        setUomCategory('Unit');
        setIsBaseUom(true);
        setBaseUomId('');
        setConversionFactor('1.0');
        setIsUomModalOpen(true);
    };

    const handleSaveUom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const uomData: any = {
                name: uomName,
                code: uomCode,
                category: uomCategory,
                is_base_uom: isBaseUom,
                conversion_factor: parseFloat(conversionFactor)
            };

            if (!isBaseUom && baseUomId) {
                uomData.base_uom_id = baseUomId;
            }

            if (editingUom) {
                await uomService.updateUom(editingUom.id, uomData);
            } else {
                await uomService.createUom(uomData);
            }

            setIsUomModalOpen(false);
            loadData();
        } catch (err: any) {
            alert(`Error saving UOM: ${err.message}`);
        }
    };

    const handleDeleteUom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this UOM?')) return;
        try {
            await uomService.deleteUom(id);
            loadData();
        } catch (err: any) {
            alert(`Error deleting UOM: ${err.message}`);
        }
    };

    if (loading) return <div className="loading">Loading UOM data...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="uom-settings-page">
            <div className="page-header">
                <h1>Unit of Measure (UOM) Settings</h1>
                <button className="btn btn-primary" onClick={handleAddUom}>
                    + Add UOM
                </button>
            </div>

            <div className="uom-list" style={{ marginBottom: '2rem' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Conversion</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uoms.map(uom => (
                            <tr key={uom.id}>
                                <td>{uom.name}</td>
                                <td>{uom.code}</td>
                                <td>{uom.category}</td>
                                <td>{uom.is_base_uom ? <span className="badge badge-success">Base Unit</span> : 'Derived Unit'}</td>
                                <td>
                                    {uom.is_base_uom ? '-' : `1 ${uom.code} = ${uom.conversion_factor} ${uoms.find(u => u.id === uom.base_uom_id)?.code || 'Base Unit'}`}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-secondary" onClick={() => handleEditUom(uom)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUom(uom.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {uoms.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>No UOMs defined. Add one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <h2>UOM Conversions</h2>
            <div className="uom-list">
                <table className="table">
                    <thead>
                        <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Factor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conversions.map(conv => (
                            <tr key={conv.id}>
                                <td>{conv.from_uom_name || 'Unknown'}</td>
                                <td>{conv.to_uom_name || 'Unknown'}</td>
                                <td>{conv.conversion_factor}</td>
                                <td>
                                    <span style={{ color: '#666', fontSize: '0.9em' }}>
                                        1 {conv.from_uom_name} = {conv.conversion_factor} {conv.to_uom_name}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {conversions.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center' }}>No additional conversions defined. (Use "Derived Unit" above to define standard conversions)</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isUomModalOpen && (
                <div className="modal-overlay" onClick={() => setIsUomModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingUom ? 'Edit UOM' : 'Add New UOM'}</h2>
                        <form onSubmit={handleSaveUom}>
                            <div className="form-group">
                                <label>UOM Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={uomName}
                                    onChange={e => setUomName(e.target.value)}
                                    placeholder="e.g. Kilogram"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>UOM Code *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={uomCode}
                                    onChange={e => setUomCode(e.target.value)}
                                    placeholder="e.g. kg"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    className="input"
                                    value={uomCategory}
                                    onChange={e => setUomCategory(e.target.value)}
                                >
                                    <option value="Unit">Unit (Count)</option>
                                    <option value="Weight">Weight</option>
                                    <option value="Volume">Volume</option>
                                    <option value="Length">Length</option>
                                    <option value="Time">Time</option>
                                </select>
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isBaseUom}
                                        onChange={e => setIsBaseUom(e.target.checked)}
                                    />
                                    Is Base Unit?
                                </label>
                            </div>

                            {!isBaseUom && (
                                <>
                                    <div className="form-group">
                                        <label>Base UOM</label>
                                        <select
                                            className="input"
                                            value={baseUomId}
                                            onChange={e => setBaseUomId(e.target.value)}
                                            required={!isBaseUom}
                                        >
                                            <option value="">Select Base UOM</option>
                                            {uoms.filter(u => u.is_base_uom && u.category === uomCategory && u.id !== editingUom?.id).map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Conversion Factor</label>
                                        <div className="input-group">
                                            <span>1 {uomCode || 'Unit'} = </span>
                                            <input
                                                type="number"
                                                className="input"
                                                value={conversionFactor}
                                                onChange={e => setConversionFactor(e.target.value)}
                                                step="0.000001"
                                                required={!isBaseUom}
                                            />
                                            <span> {baseUomId ? uoms.find(u => u.id === baseUomId)?.code : 'Base Unit'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsUomModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save UOM</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
