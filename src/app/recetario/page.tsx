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
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b88364] mx-auto mb-4" />
          <p className="text-[#f0ebe3]">Cargando recetario...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ebe3]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#b88364]/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-serif tracking-wide">🍳 Recetario</h1>
            <p className="text-xs text-[#b88364] tracking-widest uppercase mt-1">Hangar 5</p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Buscar receta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-[#b88364]/20 text-sm text-[#f0ebe3] placeholder:text-[#f0ebe3]/30 focus:outline-none focus:border-[#b88364] w-48"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-[#b88364]/20 text-sm text-[#f0ebe3] focus:outline-none focus:border-[#b88364]"
            >
              {categories.map(c => (
                <option key={c} value={c} className="bg-[#1a1a1a]">
                  {c === 'todas' ? 'Todas las categorías' : c}
                </option>
              ))}
            </select>
            <Link href="/" className="text-xs text-[#b88364] hover:text-[#f0ebe3] transition-colors ml-4">
              ← Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#f0ebe3]/40 text-lg">No se encontraron recetas</p>
            {recipes.length === 0 && (
              <p className="text-[#f0ebe3]/20 text-sm mt-2">Aún no hay recetas creadas. Créalas desde el admin.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelected(recipe)}
                className="group text-left bg-white/5 rounded-xl overflow-hidden border border-[#b88364]/10 hover:border-[#b88364]/40 hover:bg-white/8 transition-all duration-300"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-[#1a1a1a] relative overflow-hidden">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                      {recipe.isTemplate ? '📋' : '🍽️'}
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {recipe.isTemplate && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#b88364]/20 text-[#b88364] border border-[#b88364]/30">
                        Plantilla
                      </span>
                    )}
                    {recipe.inheritedIngredientCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        🔗 +{recipe.inheritedIngredientCount}
                      </span>
                    )}
                  </div>
                  {recipe.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-black/60 text-[#f0ebe3]/80">
                      {recipe.category}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-serif text-lg group-hover:text-[#b88364] transition-colors">
                    {recipe.name}
                  </h3>
                  {recipe.parentName && (
                    <p className="text-xs text-[#b88364]/60 mt-0.5">
                      Extiende: {recipe.parentName}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2 text-xs text-[#f0ebe3]/50">
                    <span>{recipe.ingredients.length} ingredientes</span>
                    <span>{formatPrice(recipe.price)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-[#f0ebe3]/30">
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full border border-[#b88364]/20 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            {selected.imageUrl && (
              <div className="aspect-[16/9] bg-[#111]">
                <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-serif">{selected.name}</h2>
                  <div className="flex gap-2 mt-2">
                    {selected.category && (
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-[#f0ebe3]/70">
                        {selected.category}
                      </span>
                    )}
                    {selected.isTemplate && (
                      <span className="px-2 py-0.5 rounded text-xs bg-[#b88364]/20 text-[#b88364]">
                        📋 Plantilla
                      </span>
                    )}
                    {selected.variationCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                        {selected.variationCount} variaciones
                      </span>
                    )}
                  </div>
                  {selected.parentName && (
                    <p className="text-sm text-[#b88364]/70 mt-2">
                      🔗 Extiende: <span className="text-[#f0ebe3]/80">{selected.parentName}</span>
                      {selected.inheritedIngredientCount > 0 && (
                        <span className="text-purple-300/70 ml-2">
                          (+{selected.inheritedIngredientCount} ingredientes heredados)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[#f0ebe3]/40 hover:text-[#f0ebe3] text-xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#f0ebe3]/40 uppercase tracking-wider">Precio venta</p>
                  <p className="text-lg font-serif mt-1">{formatPrice(selected.price)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#f0ebe3]/40 uppercase tracking-wider">Costo total</p>
                  <p className="text-lg font-serif mt-1 text-[#b88364]">${selected.totalCost.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-[#f0ebe3]/40 uppercase tracking-wider">Rinde</p>
                  <p className="text-lg font-serif mt-1">{selected.yieldQuantity}</p>
                </div>
              </div>

              {/* Ingredients */}
              <h3 className="text-sm uppercase tracking-widest text-[#f0ebe3]/40 mb-3">Ingredientes</h3>
              <div className="space-y-2 mb-6">
                {selected.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      ing.inherited ? 'bg-purple-500/5 border border-purple-500/10' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{ing.name}</span>
                      {ing.inherited && (
                        <span className="text-[10px] text-purple-300/60">heredado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#f0ebe3]/60">
                      <span>{ing.quantity} {ing.unit}</span>
                      <span className="text-xs text-[#f0ebe3]/30">${(ing.cost * ing.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className="bg-[#b88364]/5 border border-[#b88364]/10 rounded-lg p-4 mb-4">
                  <p className="text-xs uppercase tracking-widest text-[#b88364]/60 mb-1">Notas</p>
                  <p className="text-sm text-[#f0ebe3]/70">{selected.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#b88364]/10">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors"
                >
                  🖨 Imprimir
                </button>
                <Link
                  href="/admin/restaurant/recipes"
                  className="px-4 py-2 rounded-lg bg-[#b88364]/20 text-sm text-[#b88364] hover:bg-[#b88364]/30 transition-colors"
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
