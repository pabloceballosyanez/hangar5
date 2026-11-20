'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

interface ScannedItem {
  rawText: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  matchedIngredientId: string | null;
  matchedIngredientName: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

export default function ScanReceiptPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugAI, setDebugAI] = useState<string | null>(null);

  // Load ingredients on mount for the edit dropdown
  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/ingredients');
      if (res.ok) setIngredients(await res.json());
    } catch { /* ignore */ }
  }, []);

  // ─── Handle file selection ──────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setItems([]);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      scanReceipt(base64);
    };
    reader.readAsDataURL(file);
  }

  // ─── Handle drop ────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setItems([]);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      scanReceipt(base64);
    };
    reader.readAsDataURL(file);
  }

  // ─── Scan receipt with AI ───────────────────────────────────────────────

  async function scanReceipt(imageBase64: string) {
    setScanning(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/restaurant/inventory/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDebugAI(data.error || 'Error desconocido');
        throw new Error(data.error || 'Error al procesar');
      }

      setItems(data.items || []);
      if (data.items?.length === 0) {
        setError('No se encontraron productos en la imagen. Intenta con otra foto más clara.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al escanear');
    } finally {
      setScanning(false);
      loadIngredients();
    }
  }

  // ─── Update item fields ─────────────────────────────────────────────────

  function updateItem(idx: number, field: keyof ScannedItem, value: string | number | null) {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };

      // If changing matchedIngredientId, auto-fill name/unit
      if (field === 'matchedIngredientId' && typeof value === 'string' && value) {
        const ing = ingredients.find((i) => i.id === value);
        if (ing) {
          updated[idx].matchedIngredientName = ing.name;
          updated[idx].name = ing.name;
          updated[idx].unit = ing.unit;
          updated[idx].confidence = 'HIGH';
        }
      }

      return updated;
    });
  }

  // ─── Delete item ────────────────────────────────────────────────────────

  function deleteItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // ─── Save to stock ──────────────────────────────────────────────────────

  async function handleSave() {
    if (items.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const body = {
        items: items.map((item) => ({
          ingredientId: item.matchedIngredientId || undefined,
          newIngredient:
            !item.matchedIngredientId
              ? {
                  name: item.name,
                  unit: item.unit,
                  cost: Math.round(item.price * 100),
                }
              : undefined,
          quantity: item.quantity,
          notes: item.rawText,
        })),
        reason: 'Compra (recibo escaneado)',
      };

      const res = await fetch('/api/admin/restaurant/inventory/bulk-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }

      const data = await res.json();
      setSuccess(
        `${data.results.length} ingredientes actualizados. ` +
          data.results.map((r: { name: string; newStock: number }) =>
            `${r.name}: ${r.newStock} en stock`
          ).join(' | ')
      );
      setItems([]);
      setImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const confidenceColor: Record<string, string> = {
    HIGH: 'bg-[var(--color-adp-listo)] text-white',
    MEDIUM: 'bg-[var(--color-adp-atencion)] text-white',
    LOW: 'bg-[var(--color-adp-urgente)] text-white',
  };
  const confidenceLabel: Record<string, string> = {
    HIGH: '✓ Match',
    MEDIUM: '? Similar',
    LOW: '✗ Nuevo',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">📸 Escanear Recibo</h1>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">
            Toma una foto del recibo y la IA extraerá los productos automáticamente
          </p>
        </div>
        <Link
          href="/admin/restaurant/ingredients"
          className="text-sm text-[var(--color-adp-pino)] hover:text-[var(--color-adp-info)]"
        >
          ← Inventario
        </Link>
      </div>

      {/* Upload area */}
      {!image && !scanning && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--color-adp-borde-2)] rounded-xl p-12 text-center cursor-pointer
            hover:border-[var(--color-adp-info)] hover:bg-[var(--color-adp-info)]/85/50 transition-all"
        >
          <div className="text-5xl mb-4">📷</div>
          <p className="text-lg font-medium text-[var(--color-adp-tinta)] mb-2">
            Toca para tomar foto o arrastra una imagen
          </p>
          <p className="text-sm text-[var(--color-adp-tinta-2)]">
            JPG, PNG o HEIC • Recibos, tickets, facturas
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-adp-info)] mx-auto mb-6" />
          <p className="text-lg font-medium text-[var(--color-adp-tinta)] mb-2">
            Analizando recibo con IA...
          </p>
          <p className="text-sm text-[var(--color-adp-tinta-2)]">
            Extrayendo productos, cantidades y precios
          </p>
          {image && (
            <img
              src={image}
              alt="Recibo"
              className="mt-6 mx-auto max-h-48 rounded-lg opacity-50"
            />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[var(--color-adp-urgente)] border border-[var(--color-adp-urgente)] rounded-xl p-4 text-white">
          <p className="text-sm text-[var(--color-adp-urgente)]">{error}</p>
          {debugAI && (
            <details className="mt-2">
              <summary className="text-xs text-[var(--color-adp-urgente)] cursor-pointer">Debug</summary>
              <pre className="text-xs text-[var(--color-adp-urgente)] mt-1 whitespace-pre-wrap">{debugAI}</pre>
            </details>
          )}
          <button
            onClick={() => { setError(null); setImage(null); setDebugAI(null); }}
            className="mt-3 text-sm text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] font-medium"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-[var(--color-adp-listo)] border border-[var(--color-adp-listo)] rounded-xl p-4 text-white">
          <p className="text-sm text-[var(--color-adp-listo)] font-medium mb-1">✅ ¡Inventario actualizado!</p>
          <p className="text-xs text-[var(--color-adp-pino)]">{success}</p>
          <button
            onClick={() => { setSuccess(null); setImage(null); }}
            className="mt-3 text-sm text-[var(--color-adp-pino)] hover:text-[var(--color-adp-listo)] font-medium"
          >
            Escanear otro recibo
          </button>
        </div>
      )}

      {/* Review items */}
      {items.length > 0 && !success && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--color-adp-tinta)]">
                {items.length} productos encontrados
              </h2>
              {image && (
                <img src={image} alt="Recibo" className="mt-2 max-h-32 rounded-lg" />
              )}
            </div>
            <button
              onClick={() => { setItems([]); setImage(null); }}
              className="text-sm text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)]"
            >
              Cancelar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-adp-borde)]">
                  <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] text-xs uppercase">Producto</th>
                  <th className="text-center py-3 px-3 font-medium text-[var(--color-adp-tinta-2)] text-xs uppercase w-20">Cantidad</th>
                  <th className="text-center py-3 px-3 font-medium text-[var(--color-adp-tinta-2)] text-xs uppercase w-16">Unidad</th>
                  <th className="text-right py-3 px-3 font-medium text-[var(--color-adp-tinta-2)] text-xs uppercase w-20">Precio</th>
                  <th className="text-center py-3 px-3 font-medium text-[var(--color-adp-tinta-2)] text-xs uppercase w-24">Match</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-adp-borde)]">
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[var(--color-adp-papel-3)] ${
                      item.confidence === 'LOW' ? 'hover:bg-[var(--color-adp-urgente)]/85/10/30' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="py-2 px-4">
                      {item.confidence === 'LOW' ? (
                        <div>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-[var(--color-adp-borde-2)] rounded text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                          />
                          <p className="text-xs text-[var(--color-adp-tinta-2)] mt-0.5">
                            Nuevo: se creará como ingrediente
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-[var(--color-adp-tinta)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-adp-tinta-2)]">{item.rawText}</p>
                        </div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0.01"
                        className="w-16 px-1 py-1 border border-[var(--color-adp-borde-2)] rounded text-center text-sm
                          focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3 text-center">
                      {item.confidence === 'LOW' ? (
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="w-14 px-1 py-1 border border-[var(--color-adp-borde-2)] rounded text-center text-sm
                            focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
                        />
                      ) : (
                        <span className="text-[var(--color-adp-tinta-2)] text-xs">{item.unit}</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3 text-right">
                      <span className="text-[var(--color-adp-tinta)]">${item.price.toFixed(2)}</span>
                    </td>

                    {/* Match confidence / dropdown */}
                    <td className="py-2 px-3">
                      <select
                        value={item.matchedIngredientId || ''}
                        onChange={(e) =>
                          updateItem(idx, 'matchedIngredientId', e.target.value || null)
                        }
                        className={`w-full px-1.5 py-1 rounded text-xs border focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none ${
                          item.confidence === 'LOW'
                            ? 'border-[var(--color-adp-urgente)] bg-[var(--color-adp-urgente)]'
                            : 'border-[var(--color-adp-borde)]'
                        } text-white`}
                      >
                        <option value="">Crear nuevo</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          confidenceColor[item.confidence]
                        }`}
                      >
                        {confidenceLabel[item.confidence]}
                      </span>
                    </td>

                    {/* Remove */}
                    <td className="py-2 px-1 text-center">
                      <button
                        onClick={() => deleteItem(idx)}
                        className="text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)] flex items-center justify-between">
            <p className="text-xs text-[var(--color-adp-tinta-2)]">
              🟢 Match • 🟡 Similar • 🔴 Nuevo (se creará ingrediente)
            </p>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="px-6 py-2.5 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg
                hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : `Guardar ${items.length} productos al inventario`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
