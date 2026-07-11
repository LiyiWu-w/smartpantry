import { useState } from "react";

const initialItems = [
  {
    id: 1,
    ingredient: "Baby Spinach",
    category: "Greens",
    quantity: "1 bag",
    location: "Fridge",
    purchaseDate: "2026-07-08",
    expiryDate: "2026-07-13",
    handling: "Keep chilled",
  },
  {
    id: 2,
    ingredient: "Greek Yogurt",
    category: "Dairy",
    quantity: "2 tubs",
    location: "Fridge",
    purchaseDate: "2026-07-09",
    expiryDate: "2026-07-12",
    handling: "Use soon",
  },
  {
    id: 3,
    ingredient: "Tomato Sauce",
    category: "Pantry",
    quantity: "1 jar",
    location: "Pantry",
    purchaseDate: "2026-05-30",
    expiryDate: "2026-06-20",
    handling: "Discard if opened",
  },
  {
    id: 4,
    ingredient: "Whole Wheat Bread",
    category: "Bakery",
    quantity: "1 loaf",
    location: "Counter",
    purchaseDate: "2026-07-10",
    expiryDate: "2026-07-20",
    handling: "Wrap tightly",
  },
  {
    id: 5,
    ingredient: "Cherry Tomatoes",
    category: "Vegetables",
    quantity: "1 pint",
    location: "Fridge",
    purchaseDate: "2026-07-09",
    expiryDate: "2026-07-18",
    handling: "Rinse before use",
  },
  {
    id: 6,
    ingredient: "Cheddar Cheese",
    category: "Dairy",
    quantity: "200g",
    location: "Fridge",
    purchaseDate: "2026-07-05",
    expiryDate: "2026-07-25",
    handling: "Keep sealed",
  },
];

const EMPTY_FORM = {
  ingredient: "",
  category: "",
  quantity: "",
  location: "Fridge",
  purchaseDate: "",
  expiryDate: "",
  handling: "",
};

function getFreshness(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays <= 3) return "Expiring Soon";
  return "Fresh";
}

function badgeClass(status) {
  if (status === "Fresh") return "bg-emerald-100 text-emerald-700";
  if (status === "Expiring Soon") return "bg-amber-100 text-amber-700";
  if (status === "Expired") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default function Inventory() {
  const [items, setItems] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const freshItems = items.map((item) => ({
    ...item,
    freshness: getFreshness(item.expiryDate),
  }));

  const summary = {
    totalItems: freshItems.length,
    expiringSoon: freshItems.filter((i) => i.freshness === "Expiring Soon").length,
    expired: freshItems.filter((i) => i.freshness === "Expired").length,
    locations: new Set(freshItems.map((i) => i.location)).size,
  };

  function validate() {
    const e = {};
    if (!form.ingredient.trim()) e.ingredient = "Required";
    if (!form.category.trim()) e.category = "Required";
    if (!form.quantity.trim()) e.quantity = "Required";
    if (!form.purchaseDate) e.purchaseDate = "Required";
    if (!form.expiryDate) e.expiryDate = "Required";
    if (form.purchaseDate && form.expiryDate && form.expiryDate < form.purchaseDate)
      e.expiryDate = "Expiry must be after purchase date";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setItems([...items, { ...form, id: Date.now() }]);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  }

  function handleDelete(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-[32px] border border-emerald-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Inventory</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Keep your pantry fresh and organized.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Track ingredients, expiry dates, storage locations, and freshness status at a glance.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Add Ingredient
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Items", value: summary.totalItems, desc: "All tracked pantry and fridge ingredients." },
            { label: "Expiring Soon", value: summary.expiringSoon, desc: "Ingredients that need attention this week." },
            { label: "Expired", value: summary.expired, desc: "Items to remove or refresh soon." },
            { label: "Storage Locations", value: summary.locations, desc: "Fridge, pantry, freezer, and counter spots." },
          ].map(({ label, value, desc }) => (
            <div key={label} className="rounded-[32px] border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">{label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
              <p className="mt-2 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </section>

        {/* Table */}
        <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Inventory Table</h2>
            <p className="mt-1 text-sm text-slate-500">Review your current ingredients and their freshness status.</p>

            {freshItems.length === 0 ? (
              <div className="mt-8 text-center text-sm text-slate-400">
                No ingredients yet. Add your first one!
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100">
                  <thead className="bg-emerald-50">
                    <tr>
                      {["Ingredient", "Category", "Quantity", "Storage Location", "Purchase Date", "Expiry Date", "Handling Status", "Freshness", ""].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 bg-white">
                    {freshItems.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">{item.ingredient}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.category}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.location}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.purchaseDate}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.expiryDate}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{item.handling}</td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(item.freshness)}`}>
                            {item.freshness}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-full px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Food Storage Tips</h3>
              <p className="mt-2 text-sm text-slate-600">Simple habits make your ingredients last longer and reduce waste.</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  "Store fresh greens in a sealed container with a paper towel to keep them crisp.",
                  "Keep opened jars in the fridge and label them with the date opened.",
                  "Rotate older items to the front so you use them before newer ones.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Why it matters</h3>
              <p className="mt-2 text-sm text-slate-600">
                Tracking expiry and storage helps you cook smarter, save money, and keep your pantry in good shape.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Add Ingredient</h2>
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm(EMPTY_FORM); }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Ingredient Name", field: "ingredient", type: "text", placeholder: "e.g. Baby Spinach" },
                { label: "Category", field: "category", type: "text", placeholder: "e.g. Greens, Dairy" },
                { label: "Quantity", field: "quantity", type: "text", placeholder: "e.g. 1 bag, 2 tubs" },
                { label: "Handling Notes", field: "handling", type: "text", placeholder: "e.g. Keep chilled" },
                { label: "Purchase Date", field: "purchaseDate", type: "date", placeholder: "" },
                { label: "Expiry Date", field: "expiryDate", type: "date", placeholder: "" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-200 ${
                      errors[field] ? "border-red-400" : "border-emerald-200"
                    }`}
                  />
                  {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location</label>
                <select
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {["Fridge", "Freezer", "Pantry", "Counter"].map((loc) => (
                    <option key={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm(EMPTY_FORM); }}
                className="rounded-full border border-emerald-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
