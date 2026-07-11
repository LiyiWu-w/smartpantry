export default function Dashboard() {
  const summary = [
    { label: "Expiring Soon", value: "5 items", detail: "Fresh ingredients need attention" },
    { label: "Saved Recipes", value: "12 recipes", detail: "Favorites ready to cook" },
    { label: "Planned Meals", value: "4 meals", detail: "This week's meal schedule" },
  ];

  const expiringItems = [
    { name: "Spinach", expiresIn: "1 day", qty: "1 bag" },
    { name: "Greek Yogurt", expiresIn: "2 days", qty: "2 tubs" },
    { name: "Cherry Tomatoes", expiresIn: "2 days", qty: "1 pint" },
    { name: "Whole Wheat Bread", expiresIn: "3 days", qty: "1 loaf" },
  ];

  const suggestions = [
    { title: "Green Smoothie Bowl", tags: ["Breakfast", "Vegan"] },
    { title: "Tomato Basil Pasta", tags: ["Dinner", "Easy"] },
    { title: "Yogurt Parfait", tags: ["Snack", "Quick"] },
  ];

  const mealPlan = [
    { day: "Mon", meal: "Veggie Stir Fry" },
    { day: "Wed", meal: "Chicken Salad Wraps" },
    { day: "Fri", meal: "Taco Night" },
    { day: "Sun", meal: "Sheet Pan Dinner" },
  ];

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                SmartPantry
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Welcome back, food smart.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Check your freshest ingredients, recipe ideas, and meal plan for the week.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-600">
                {item.label}
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Expiring Soon</h2>
                <p className="text-sm text-slate-500">
                  Use them before they go bad and reduce waste.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                4 items
              </span>
            </div>

            <div className="space-y-4">
              {expiringItems.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-2 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.qty}</p>
                  </div>
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                    {item.expiresIn}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">What Can I Cook?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Quick recipe ideas based on what’s in your pantry.
            </p>
            <div className="mt-6 space-y-4">
              {suggestions.map((recipe) => (
                <div
                  key={recipe.title}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{recipe.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <section className="mt-8 rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">This Week’s Meal Plan</h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick preview to help you stay organized.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              View full plan
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mealPlan.map((entry) => (
              <div
                key={entry.day}
                className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {entry.day}
                </p>
                <p className="mt-3 text-base font-semibold text-slate-900">{entry.meal}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}