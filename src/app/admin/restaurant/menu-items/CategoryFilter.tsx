"use client";

import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

interface CategoryFilterProps {
  categories: Category[];
  currentCategoryId?: string;
}

export default function CategoryFilter({ categories, currentCategoryId }: CategoryFilterProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const url = val
      ? `/admin/restaurant/menu-items?categoryId=${encodeURIComponent(val)}`
      : "/admin/restaurant/menu-items";
    router.push(url);
  }

  return (
    <select
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
      defaultValue={currentCategoryId || ""}
      onChange={handleChange}
    >
      <option value="">Todas</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
