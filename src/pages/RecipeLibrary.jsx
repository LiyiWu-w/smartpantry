import { useState } from "react";

const initialRecipes = [
  {
    id: 1,
    name: "Avocado Toast",
    tags: ["Breakfast", "Quick", "Vegetarian"],
    calories: 320,
    time: 15,
    difficulty: "Easy",
    rating: 4.6,
    ingredients: ["Bread", "Avocado", "Lemon", "Chili Flakes"],
  },
  {
    id: 2,
    name: "One-Pan Veggie Pasta",
    tags: ["Dinner", "Plant-based", "Comfort"],
    calories: 450,
    time: 30,
    difficulty: "Medium",
    rating: 4.8,
    ingredients: ["Pasta", "Tomatoes", "Zucchini", "Basil"],
  },
  {
    id: 3,
    name: "Mango Quinoa Salad",
    tags: ["Lunch", "Fresh", "Gluten-Free"],
    calories: 280,
    time: 20,
    difficulty: "Easy",
    rating: 4.4,
    ingredients: ["Quinoa", "Mango", "Spinach", "Lime"],
  },
];

const EMPTY_FORM = {
  name: "",
  tags: "",
  calories: "",
  time: "",
  difficulty: "Easy",
  rating: "",
  ingredients: "",
};

const ALL_TAGS = ["All", "Breakfast", "Lunch", "Dinner", "Vegan", "Quick", "Vegetarian"];
const TIME_FILTERS = [
  { label: "All", max: Infinity },
  { label: "15 min", max: 15 },
  { label: "30 min", max: 30 },
  { label: "45 min", max: 45 },
  { label: "60+ min", max: Infinity, min: 60 },
];
const CAL_FILTERS = [
  { label: "All", max: Infinity },
  { label: "< 300", max: 299 },
  { label: "300-500", min: 300, max: 500 },
  { label: "500-700", min: 500, max: 700 },
  { label: "700+", min: 700, max: Infinity },
];
const RATING_FILTERS = [
  { label: "Any", min: 0 },
  { label: "3+", min: 3 },
  { label: "4+", min: 4 },
  { label: "5", min: 5 },
];

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [activeTime, setActiveTime] = useState("All");
  const [activeCal, setActiveCal] = useState("All");
  const [activeRating, setActiveRating] = useState("Any");

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.ingredients.some((i) => i.toLowerCase().includes(q)) ||
      r.tags.some((t) => t.toLowerCase().includes(q));

    const matchTag = activeTag === "All" || r.tags.includes(activeTag);

    const tf = TIME_FILTERS.find((f) => f.label === activeTime);
    const matchTime = !tf || (r.time <= tf.max && r.time >= (tf.min || 0));

    const cf = CAL_FILTERS.find((f) => f.label === activeCal);
    const matchCal = !cf || (r.calories <= cf.max && r.calories >= (cf.min || 0));

    const rf = RATING_FILTERS.find((f) => f.label === activeRating);
    const matchRating = !rf || r.rating >= rf.min;

    return matchSearch && matchTag && matchTime && matchCal && matchRating;
  });

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.calories || isNaN(Number(form.calories))) e.calories = "Enter a valid number";
    if (!form.time || isNaN(Number(form.time))) e.time = "Enter minutes as a number";
    if (!form.rating || isNaN(Number(form.rating)) || Number(form.rating) < 1 || Number(form.rating) > 5)
      e.rating = "Enter a rating from 1 to 5";
    if (!form.ingredients.trim()) e.ingredients = "Required";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const newRecipe = {
      id: Date.now(),
      name: form.name.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      calories: Number(form.calories),
      time: Number(form.time),
      difficulty: form.difficulty,
      rating: parseFloat(Number(form.rating).toFixed(1)),
      ingredients: form.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
    };
    setRecipes([...recipes, newRecipe]);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  }

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  }

  function FilterBtn({ active, onClick, children }) {
    return (
      <button
        onClick={onClick}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
          active
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-[32px] border border-emerald-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Recipe Library</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Discover tasty ideas from your SmartPantry.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Search, filter, and save recipes that match your ingredients and meal goals.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Add Recipe
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[32px] border border-emerald-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Search recipes</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ingredients, or tag"
                className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
              <button className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Search
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Tag</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <FilterBtn key={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)}>{tag}</FilterBtn>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Cooking Time</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TIME_FILTERS.map((f) => (
                    <FilterBtn key={f.label} active={activeTime === f.label} onClick={() => setActiveTime(f.label)}>{f.label}</FilterBtn>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Calories</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CAL_FILTERS.map((f) => (
                    <FilterBtn key={f.label} active={activeCal === f.label} onClick={() => setActiveCal(f.label)}>{f.label}</FilterBtn>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Rating</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {RATING_FILTERS.map((f) => (
                    <FilterBtn key={f.label} active={activeRating === f.label} onClick={() => setActiveRating(f.label)}>{f.label}</FilterBtn>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick filter tips</h2>
            <p className="mt-2 text-sm text-slate-500">Tap a filter to narrow recipes by mood, time, calories, or rating.</p>
            <div className="mt-6 space-y-3">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="font-semibold text-slate-900">Ready in 30 minutes</p>
                <p className="mt-1 text-sm text-slate-600">Perfect for busy school nights and fast meal prep.</p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="font-semibold text-slate-900">Under 500 calories</p>
                <p className="mt-1 text-sm text-slate-600">Light options that still feel satisfying.</p>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </aside>
        </section>

        {/* Recipe Cards */}
        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-3 rounded-[32px] border border-emerald-200 bg-white p-12 text-center text-sm text-slate-400">
              No recipes match your filters. Try adjusting your search or add a new recipe!
            </div>
          ) : (
            filtered.map((recipe) => (
              <article
                key={recipe.id}
                className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{recipe.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recipe.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shrink-0">
                    {recipe.rating} ★
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">Calories</p>
                    <p>{recipe.calories}</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">Time</p>
                    <p>{recipe.time} min</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">Difficulty</p>
                    <p>{recipe.difficulty}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-emerald-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Ingredients Preview</p>
                  <p className="mt-2 text-sm text-slate-600">{recipe.ingredients.join(", ")}</p>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {/* Add Recipe Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Add Recipe</h2>
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm(EMPTY_FORM); }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Recipe Name", field: "name", type: "text", placeholder: "e.g. Avocado Toast", full: true },
                { label: "Tags (comma-separated)", field: "tags", type: "text", placeholder: "e.g. Breakfast, Quick", full: true },
                { label: "Calories", field: "calories", type: "number", placeholder: "e.g. 320" },
                { label: "Cooking Time (minutes)", field: "time", type: "number", placeholder: "e.g. 15" },
                { label: "Rating (1–5)", field: "rating", type: "number", placeholder: "e.g. 4.5" },
              ].map(({ label, field, type, placeholder, full }) => (
                <div key={field} className={full ? "sm:col-span-2" : ""}>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => handleChange("difficulty", e.target.value)}
                  className="w-full rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {["Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ingredients (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Bread, Avocado, Lemon"
                  value={form.ingredients}
                  onChange={(e) => handleChange("ingredients", e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-200 ${
                    errors.ingredients ? "border-red-400" : "border-emerald-200"
                  }`}
                />
                {errors.ingredients && <p className="mt-1 text-xs text-red-500">{errors.ingredients}</p>}
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
                Add Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
