'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  inherited: boolean;
}

interface Recipe {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  category: string | null;
  isTemplate: boolean;
  parentRecipeId: string | null;
  parentName: string | null;
  yieldQuantity: number;
  notes: string | null;
  ingredients: Ingredient[];
  totalCost: number;
  ownIngredientCount: number;
  inheritedIngredientCount: number;
  variationCount: number;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function RecetarioPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('todas');

  useEffect(() => {
    fetch('/api/recetario')
      .then(r => r.json())
      .then(d => { setRecipes(d.recipes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['todas', ...new Set(recipes.map(r => r.category).filter(Boolean))] as string[];

  const filtered = recipes.filter(r => {
    if (category !== 'todas' && r.category !== category) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-night flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold border-t-transparent mx-auto mb-4" />
          <p className="text-muted tracking-wide">Cargando recetario…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-night text-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-night/95 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="kicker !mb-1">Hangar 5</p>
            <h1 className="display text-3xl tracking-wide">Recetario</h1>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Buscar receta…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-night !py-2 !px-4 text-sm w-48"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-night !py-2 !px-4 text-sm"
            >
              {categories.map(c => (
                <option key={c} value={c} className="bg-night-2">
                  {c === 'todas' ? 'Todas las categorías' : c}
                </option>
              ))}
            </select>
            <Link href="/" className="text-xs tracking-[0.15em] uppercase text-gold hover:text-cream transition-colors ml-4">
              ← Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-[family-name:var(--font-display)] text-2xl text-muted">No se encontraron recetas</p>
            {recipes.length === 0 && (
              <p className="text-faint text-sm mt-2">Aún no hay recetas creadas. Créalas desde el admin.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelected(recipe)}
                className="group text-left card-night !p-0 overflow-hidden hover:border-gold-dim/60 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-night-3 relative overflow-hidden">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover foto group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="display italic text-3xl text-gold-dim/40">H5</span>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {recipe.isTemplate && (
                      <span className="badge badge-gold !text-[9px] !py-0.5 !px-2">
                        Plantilla
                      </span>
                    )}
                    {recipe.inheritedIngredientCount > 0 && (
                      <span className="badge badge-info !text-[9px] !py-0.5 !px-2">
                        +{recipe.inheritedIngredientCount} heredados
                      </span>
                    )}
                  </div>
                  {recipe.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] tracking-[0.12em] uppercase bg-night/70 text-cream/80 backdrop-blur">
                      {recipe.category}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="display text-lg group-hover:text-gold transition-colors">
                    {recipe.name}
                  </h3>
                  {recipe.parentName && (
                    <p className="text-xs text-gold/60 mt-0.5">
                      Extiende: {recipe.parentName}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted">
                    <span>{recipe.ingredients.length} ingredientes</span>
                    <span className="font-[family-name:var(--font-display)] text-gold text-sm">{formatPrice(recipe.price)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-faint">
                    <span>Costo: ${recipe.totalCost.toFixed(2)}</span>
                    <span>Rinde: {recipe.yieldQuantity}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="card-night !p-0 max-w-2xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {selected.imageUrl && (
              <div className="aspect-[16/9] bg-night-3">
                <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover foto" />
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="display text-3xl">{selected.name}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selected.category && (
                      <span className="badge badge-info !text-[9px]">
                        {selected.category}
                      </span>
                    )}
                    {selected.isTemplate && (
                      <span className="badge badge-gold !text-[9px]">
                        Plantilla
                      </span>
                    )}
                    {selected.variationCount > 0 && (
                      <span className="badge badge-info !text-[9px]">
                        {selected.variationCount} variaciones
                      </span>
                    )}
                  </div>
                  {selected.parentName && (
                    <p className="text-sm text-gold/70 mt-2">
                      Extiende: <span className="text-cream/80">{selected.parentName}</span>
                      {selected.inheritedIngredientCount > 0 && (
                        <span className="text-muted ml-2">
                          (+{selected.inheritedIngredientCount} ingredientes heredados)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Cerrar"
                  className="text-faint hover:text-cream text-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-night rounded-lg p-3 text-center border border-line">
                  <p className="label-night !mb-1 !text-[9px]">Precio venta</p>
                  <p className="font-[family-name:var(--font-display)] text-lg text-gold">{formatPrice(selected.price)}</p>
                </div>
                <div className="bg-night rounded-lg p-3 text-center border border-line">
                  <p className="label-night !mb-1 !text-[9px]">Costo total</p>
                  <p className="font-[family-name:var(--font-display)] text-lg text-cream">${selected.totalCost.toFixed(2)}</p>
                </div>
                <div className="bg-night rounded-lg p-3 text-center border border-line">
                  <p className="label-night !mb-1 !text-[9px]">Rinde</p>
                  <p className="font-[family-name:var(--font-display)] text-lg text-cream">{selected.yieldQuantity}</p>
                </div>
              </div>

              {/* Ingredients */}
              <h3 className="label-night">Ingredientes</h3>
              <div className="space-y-2 mb-6">
                {selected.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      ing.inherited ? 'bg-gold/5 border border-gold-dim/25' : 'bg-night-3/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cream">{ing.name}</span>
                      {ing.inherited && (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-gold/60">heredado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>{ing.quantity} {ing.unit}</span>
                      <span className="text-xs text-faint">${(ing.cost * ing.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className="bg-gold/5 border border-gold-dim/25 rounded-lg p-4 mb-4">
                  <p className="label-night !mb-1 !text-[9px]">Notas</p>
                  <p className="text-sm text-muted">{selected.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  onClick={() => window.print()}
                  className="btn-outline !py-2.5 !px-5 text-sm"
                >
                  Imprimir
                </button>
                <Link
                  href="/admin/restaurant/recipes"
                  className="btn-gold !py-2.5 !px-5 text-sm"
                >
                  Editar en Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
