'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  cost: number;
  costDisplay: number;
  isActive: boolean;
  recipeUsageCount: number;
  createdAt: string;
  updatedAt: string;
}

function formatPrice(pesos: number) {
  return pesos.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);

  /* Pestaña del inventario. Abre en "conteo" porque es lo que se usa a
     diario: contar y comprar. "insumos" es dar de alta y editar, que se
     hace de vez en cuando. */
  /* Cuatro vistas. "Bajo mínimo" y "Negativos" son pestañas de verdad, no
     un boton con parametro: al ser estado local cambian al instante, sin
     depender de que la navegacion vuelva a montar la pagina. */
  const [pestana, setPestana] = useState<'conteo' | 'insumos' | 'bajo' | 'negativos'>('conteo');
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [cost, setCost] = useState('');

  // Stock adjustment authorization
  const [originalStock, setOriginalStock] = useState<number | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPin, setAdjustPin] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [pendingBody, setPendingBody] = useState<Record<string, unknown> | null>(null);

  // Search
  const [search, setSearch] = useState('');

  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/restaurant/ingredients');
      if (res.ok) setIngredients(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadIngredients(); }, [loadIngredients]);

  function resetForm() {
    setName('');
    setUnit('');
    setCurrentStock('0');
    setMinStock('0');
    setCost('');
    setEditId(null);
    setOriginalStock(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(ing: Ingredient) {
    setEditId(ing.id);
    setName(ing.name);
    setUnit(ing.unit);
    setCurrentStock(ing.currentStock.toString());
    setMinStock(ing.minStock.toString());
    setCost(ing.costDisplay.toString());
    setOriginalStock(ing.currentStock);
    setShowForm(true);
    setError(null);
  }

  async function doSave(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const url = editId
        ? `/api/admin/restaurant/ingredients/${editId}`
        : '/api/admin/restaurant/ingredients';
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar');
      }
      resetForm();
      await loadIngredients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !unit.trim() || !cost) return;
    const body = {
      name: name.trim(),
      unit: unit.trim(),
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
      cost: Math.round(parseFloat(cost) * 100),
    };
    // Si es edición y cambió el stock → pedir autorización de supervisor
    const newStock = parseFloat(currentStock) || 0;
    if (editId && originalStock !== null && newStock !== originalStock) {
      setPendingBody(body);
      setAdjustPin('');
      setAdjustReason('');
      setShowAdjustModal(true);
      return;
    }
    await doSave(body);
  }

  async function confirmAdjust() {
    if (!adjustReason.trim()) {
      setError('Escribí un motivo para el ajuste');
      return;
    }
    if (!pendingBody) return;
    setShowAdjustModal(false);
    await doSave({ ...pendingBody, supervisorPin: adjustPin, reason: adjustReason.trim() });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar ingrediente "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  async function toggleActive(ing: Ingredient) {
    try {
      const res = await fetch(`/api/admin/restaurant/ingredients/${ing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ing.isActive }),
      });
      if (res.ok) await loadIngredients();
    } catch { /* ignore */ }
  }

  /* ── Filtro "Qué falta" ──────────────────────────────────────────────
     El botón del panel manda ?filtro=bajo, pero la página nunca leía ese
     parámetro: navegaba y no pasaba nada. Pablo: "tenemos un filtro para
     obtener los productos con stock bajo pero no funciona... no hace nada".

     "Bajo" = el stock está por debajo del mínimo Y el mínimo es mayor que
     cero. Un insumo con mínimo 0 no "falta": simplemente no tiene tope. */
  const [filtro, setFiltro] = useState<string | null>(null);

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filtro');
    /* Enlace viejo (?filtro=bajo): ahora lleva a la pestaña dedicada. */
    setFiltro(f);
    if (f === 'bajo') setPestana('bajo');
  }, []);

  const pasaFiltro = (i: { currentStock: number; minStock: number }) => {
    if (filtro !== 'bajo') return true;
    return i.minStock > 0 && i.currentStock < i.minStock;
  };

  const activeIngredients = ingredients.filter(i => {
    if (!i.isActive) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (pestana === 'bajo') return i.minStock > 0 && i.currentStock < i.minStock && i.currentStock >= 0;
    if (pestana === 'negativos') return i.currentStock < 0;
    return true;
  });
  const inactiveIngredients = ingredients.filter(i =>
    !i.isActive && (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  /* ── Los dos avisos de inventario ───────────────────────────────────
     BAJO MÍNIMO: hay menos de lo que se pide tener. Es normal (toca
     comprar), pero hay que verlo.
     NEGATIVOS: hay menos de cero, o sea se vendió algo que el sistema no
     tenía registrado. Eso no debería pasar nunca: significa que el
     inventario no estaba cargado o que una receta descuenta de más. */
  const bajoMinimo = ingredients.filter(
    i => i.isActive && i.minStock > 0 && i.currentStock < i.minStock && i.currentStock >= 0
  );
  const negativos = ingredients.filter(
    i => i.isActive && i.currentStock < 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-adp-tinta)]">Inventario</h1>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">
            {pestana === 'bajo'
              ? `${activeIngredients.length} insumos por debajo del mínimo`
              : pestana === 'negativos'
                ? `${activeIngredients.length} insumos en negativo`
                : `${activeIngredients.length} ingredientes activos`}
          </p>
          {/* En negativo no debería haber nada nunca: significa que se
              vendió producto que el sistema no tenía registrado. Si hay,
              conviene mirarlo, no es solo "toca comprar". */}
          {pestana === 'negativos' && activeIngredients.length > 0 && (
            <p className="text-xs text-[var(--color-adp-urgente)] mt-2 max-w-md">
              Hay insumos con menos de cero: se vendió algo que no estaba
              cargado en el almacén. Revisa el conteo o la receta que los
              descuenta.
            </p>
          )}
          </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/restaurant/inventory/scan"
            className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors flex items-center gap-1.5"
          >
            📸 Escanear recibo
          </Link>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] transition-colors"
          >
            + Nuevo ingrediente
          </button>
        </div>
      </div>

      {/* Pestañas.
          Inventario mezcla dos ritmos muy distintos: contar y comprar es
          del día a día, dar de alta insumos es de una vez. Se separan
          para que quien está en el piso no tenga que pasar por la
          configuración. Abre en "Conteo", que es lo que se usa a diario. */}
      <div className="flex gap-1 border-b border-[var(--color-adp-borde)]">
        {[
            { id: 'conteo', etiqueta: 'Conteo y compras', cuenta: 0, alerta: false },
            { id: 'insumos', etiqueta: 'Todos', cuenta: 0, alerta: false },
            { id: 'bajo', etiqueta: 'Bajo mínimo', cuenta: bajoMinimo.length, alerta: true },
            { id: 'negativos', etiqueta: 'Negativos', cuenta: negativos.length, alerta: false },
          ].map((t) => (
          <button
            key={t.id}
            onClick={() => setPestana(t.id as 'conteo' | 'insumos' | 'bajo' | 'negativos')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              pestana === t.id
                ? 'border-[var(--color-adp-pino)] text-[var(--color-adp-pino)]'
                : 'border-transparent text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)]'
            }`}
          >
              {t.etiqueta}
              {t.cuenta > 0 && (
                <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  t.id === 'negativos'
                    ? 'bg-[var(--color-adp-urgente)] text-white'
                    : 'bg-[var(--color-adp-atencion)] text-white'
                }`}>
                  {t.cuenta}
                </span>
              )}
          </button>
        ))}
      </div>

      {pestana === 'conteo' && (
        <div className="bg-white border border-[var(--color-adp-borde)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-adp-tinta)] mb-1">Conteo y compras</h2>
          <p className="text-xs text-[var(--color-adp-tinta-2)] mb-4">
            Lo del día a día: qué falta, cuánto hay y qué se compró.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/admin/restaurant/inventory/scan"
              className="block border border-[var(--color-adp-borde)] rounded-lg p-4 hover:border-[var(--color-adp-pino)]/40 hover:bg-[var(--color-adp-papel-3)]"
            >
              <p className="font-medium text-[var(--color-adp-tinta)] text-sm mb-0.5">📸 Registrar compra</p>
              <p className="text-xs text-[var(--color-adp-tinta-2)]">Escanea el recibo y actualiza el stock</p>
            </Link>
            <button
              onClick={() => setPestana('negativos')}
              className="text-left w-full block border border-[var(--color-adp-borde)] rounded-lg p-4 hover:border-[var(--color-adp-urgente)]/40 hover:bg-[var(--color-adp-papel-3)]"
            >
              <p className="font-medium text-[var(--color-adp-tinta)] text-sm mb-0.5">
                Qué falta{bajoMinimo.length > 0 ? ` (${bajoMinimo.length})` : ''}
              </p>
              <p className="text-xs text-[var(--color-adp-tinta-2)]">
                {bajoMinimo.length === 0
                  ? 'Todo por encima del mínimo'
                  : 'Insumos por debajo del mínimo'}
              </p>
            </button>
            <button
              onClick={() => setPestana('negativos')}
              className="text-left w-full block border border-[var(--color-adp-borde)] rounded-lg p-4 hover:border-[var(--color-adp-urgente)]/40 hover:bg-[var(--color-adp-papel-3)]"
            >
              <p className="font-medium text-[var(--color-adp-tinta)] text-sm mb-0.5">
                En negativo{negativos.length > 0 ? ` (${negativos.length})` : ''}
              </p>
              <p className="text-xs text-[var(--color-adp-tinta-2)]">
                {negativos.length === 0
                  ? 'Ninguno en negativo'
                  : 'Vendido sin estar registrado'}
              </p>
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-adp-tinta-2)] mt-3">
            El stock de cada insumo se ve en la lista de abajo.
          </p>
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar ingrediente..."
          className="w-full max-w-md px-4 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none"
        />
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-5 space-y-4">
          <h2 className="font-semibold text-[var(--color-adp-tinta)]">{editId ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h2>
          {error && <p className="text-sm text-white bg-[var(--color-adp-urgente)] p-3 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ej: Harina de trigo" required autoFocus
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Unidad</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)}
                placeholder="Ej: kg, L, pza" required
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Costo unitario (MXN)</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)}
                step="0.01" min="0" required
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Stock actual</label>
              <input type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Stock mínimo</label>
              <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)}
                step="0.01" min="0"
                className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-adp-pino)]/40 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[var(--color-adp-pino)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-pino-hondo)] disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear ingrediente'}
            </button>
            <button type="button" onClick={resetForm}
              className="px-4 py-2 bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] text-sm font-medium rounded-lg hover:bg-[var(--color-adp-borde)] transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Ingredients list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-adp-info)] mx-auto mb-4" />
          <p className="text-[var(--color-adp-tinta-2)]">Cargando...</p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] p-8 text-center">
          <p className="text-[var(--color-adp-tinta-2)] text-lg">No hay ingredientes registrados</p>
          <p className="text-sm text-[var(--color-adp-tinta-2)] mt-1">Agrega ingredientes para empezar a crear recetas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {activeIngredients.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-adp-tinta-2)] uppercase tracking-wider mb-3">Activos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-adp-borde)] bg-[var(--color-adp-papel-3)]">
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Unidad</th>
                        <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Stock</th>
                        <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Mínimo</th>
                        <th className="text-right py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Costo</th>
                        <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Recetas</th>
                        <th className="text-center py-3 px-4 font-medium text-[var(--color-adp-tinta-2)] uppercase text-xs tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-adp-borde)]">
                      {activeIngredients.map(ing => {
                        const isLowStock = ing.currentStock <= ing.minStock;
                        return (
                          <tr key={ing.id} className={`hover:bg-[var(--color-adp-papel-3)] ${isLowStock ? 'hover:bg-[var(--color-adp-urgente)]/85/10' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Link href={`/admin/restaurant/ingredients/${ing.id}`} className="font-medium text-[var(--color-adp-tinta)] hover:text-[var(--color-adp-pino)] transition-colors">{ing.name}</Link>
                                {isLowStock && (
                                  <span className="text-xs px-1.5 py-0.5 bg-[var(--color-adp-urgente)] text-white rounded-full font-medium">
                                    Bajo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[var(--color-adp-tinta-2)]">{ing.unit}</td>
                            <td className={`py-3 px-4 text-right font-semibold tabular-nums ${isLowStock ? 'text-[var(--color-adp-urgente)]' : 'text-[var(--color-adp-tinta)]'}`}>
                              {/* El stock se mostraba con todos sus decimales
                                  (-0.8500000000000003). Se redondea a 2 como
                                  mucho y se quitan los ceros sobrantes. */}
                              {Number(ing.currentStock.toFixed(2))}
                            </td>
                            <td className="py-3 px-4 text-right text-[var(--color-adp-tinta-2)] tabular-nums">
                              {Number(ing.minStock.toFixed(2))}
                            </td>
                            <td className="py-3 px-4 text-right text-[var(--color-adp-tinta)]">{formatPrice(ing.costDisplay)}</td>
                            <td className="py-3 px-4 text-center text-[var(--color-adp-tinta-2)]">{ing.recipeUsageCount}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => startEdit(ing)}
                                  className="text-xs text-[var(--color-adp-pino)] hover:text-[var(--color-adp-pino-hondo)] font-medium transition-colors">Editar</button>
                                <button onClick={() => toggleActive(ing)}
                                  className="text-xs text-[var(--color-adp-tinta-2)] hover:text-[var(--color-adp-tinta)] font-medium transition-colors">Desactivar</button>
                                {/* Sobre el fondo rosa de las filas bajas, el rojo
                                    claro no se leía. Se usa el rojo oscuro. */}
                                <button onClick={() => handleDelete(ing.id, ing.name)}
                                  className="text-xs text-[var(--color-adp-urgente)] hover:text-[var(--color-adp-urgente)] font-medium transition-colors">Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inactive */}
          {inactiveIngredients.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-adp-tinta-2)] uppercase tracking-wider mb-3">Inactivos</h2>
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-adp-borde)] overflow-hidden opacity-60">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-[var(--color-adp-borde)]">
                      {inactiveIngredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-[var(--color-adp-papel-3)]">
                          <td className="py-3 px-4 font-medium text-[var(--color-adp-tinta-2)]">{ing.name}</td>
                          <td className="py-3 px-4 text-[var(--color-adp-tinta-2)]">{ing.unit}</td>
                          <td className="py-3 px-4 text-right text-[var(--color-adp-tinta-2)]">{ing.currentStock}</td>
                          <td className="py-3 px-4 text-right text-[var(--color-adp-tinta-2)]">{ing.minStock}</td>
                          <td className="py-3 px-4 text-right text-[var(--color-adp-tinta-2)]">{formatPrice(ing.costDisplay)}</td>
                          <td className="py-3 px-4 text-center text-[var(--color-adp-tinta-2)]">{ing.recipeUsageCount}</td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => toggleActive(ing)}
                              className="text-xs text-[var(--color-adp-info)] hover:text-[var(--color-adp-pino-hondo)] font-medium transition-colors">Reactivar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stock adjustment authorization modal ───────────────────────────── */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdjustModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--color-adp-tinta)] mb-1">Autorizar ajuste de stock</h3>
            <p className="text-sm text-[var(--color-adp-tinta-2)] mb-4">
              Cambiar el stock manualmente requiere autorización de supervisor y queda registrado en la auditoría.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">PIN de supervisor *</label>
                <input
                  type="password"
                  value={adjustPin}
                  onChange={(e) => setAdjustPin(e.target.value)}
                  autoFocus
                  placeholder="Clave de supervisor"
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-adp-tinta-2)] mb-1">Motivo del ajuste *</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                  placeholder='Ej: "Recuento físico", "Merma por caducidad"'
                  className="w-full px-3 py-2 border border-[var(--color-adp-borde-2)] rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-papel-3)] text-[var(--color-adp-tinta)] text-sm font-medium rounded-lg hover:bg-[var(--color-adp-borde)] transition-colors"
              >
                Volver
              </button>
              <button
                onClick={confirmAdjust}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[var(--color-adp-urgente)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-adp-urgente)]/85 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Autorizar y guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
