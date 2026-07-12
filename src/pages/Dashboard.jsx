import { useState, useRef, useEffect } from "react";

// ── Inventory context injected into AI prompt ─────────────────────────────
const INVENTORY_CONTEXT = `
The user's current fridge and pantry inventory:
- Spinach: 1 bag, expires in 1 day (URGENT)
- Greek Yogurt: 2 tubs, expires in 2 days
- Cherry Tomatoes: 1 pint, expires in 2 days
- Whole Wheat Bread: 1 loaf, expires in 3 days
- Cheddar Cheese: 200g, expires in 14 days
- Whole Wheat Bread: 1 loaf, expires in 9 days

The user's saved recipes:
- Green Smoothie Bowl (Breakfast, Vegan) — uses Spinach, Greek Yogurt
- Tomato Basil Pasta (Dinner, Easy) — uses Cherry Tomatoes
- Yogurt Parfait (Snack, Quick) — uses Greek Yogurt
- Avocado Toast (Breakfast, Quick) — uses Bread, Avocado
- One-Pan Veggie Pasta (Dinner) — uses Pasta, Tomatoes, Zucchini
`;

const SYSTEM_PROMPT = `You are SmartPantry Assistant, a friendly and practical AI kitchen helper. 
You have access to the user's current fridge inventory and saved recipes shown below.
Always give personalized, specific advice based on their actual ingredients — especially prioritizing items that are expiring soon.
Keep responses concise (2-4 sentences max), warm, and actionable.
If asked what to cook, always mention which expiring ingredients you're helping them use up.

${INVENTORY_CONTEXT}`;

// ── Mock AI response for Milestone 1 frontend demo ───────────────────────
async function callClaude(messages) {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";

  if (lastMsg.includes("expiring") || lastMsg.includes("expire")) {
    return "Your most urgent items are Spinach, Greek Yogurt, Cherry Tomatoes, and Whole Wheat Bread. I recommend using Spinach first because it expires soonest.";
  }

  if (lastMsg.includes("breakfast")) {
    return "For a quick breakfast, I recommend a Green Smoothie Bowl using Spinach and Greek Yogurt. This helps you use ingredients that are expiring soon.";
  }

  if (lastMsg.includes("week") || lastMsg.includes("plan")) {
    return "For this week, prioritize meals that use Spinach, Greek Yogurt, and Cherry Tomatoes first. You could plan a smoothie bowl, Tomato Basil Pasta, and Yogurt Parfait early in the week.";
  }

  if (lastMsg.includes("cook") || lastMsg.includes("dinner")) {
    return "For dinner tonight, I recommend Tomato Basil Pasta to use up the Cherry Tomatoes before they expire. You could also add Spinach as a side because it is the most urgent ingredient.";
  }

  return "Based on your current pantry, I recommend using the ingredients that are expiring soon first: Spinach, Greek Yogurt, Cherry Tomatoes, and Whole Wheat Bread.";
}

// ── Suggestion chips ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What should I cook tonight?",
  "What's expiring soon?",
  "Give me a quick breakfast idea",
  "Help me plan meals for this week",
];

export default function Dashboard() {
  const summary = [
    { label: "Expiring Soon", value: "4 items", detail: "Items close to expiration need attention" },
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

  // ── AI Chat state ─────────────────────────────────────────────────────
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your SmartPantry Assistant 🥬 I know what's in your fridge right now. Ask me what to cook, or I can help you use up ingredients before they expire!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build conversation history for API (exclude initial greeting)
      const apiMessages = newMessages
        .slice(1) // skip the initial assistant greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await callClaude(apiMessages);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">SmartPantry</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome back, food smart.</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Check your freshest ingredients, recipe ideas, and meal plan for the week.
              </p>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <section className="grid gap-4 md:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-600">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </section>

        {/* Expiring + What Can I Cook */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Expiring Soon</h2>
                <p className="text-sm text-slate-500">Use them before they go bad and reduce waste.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">4 items</span>
            </div>
            <div className="space-y-4">
              {expiringItems.map((item) => (
                <div key={item.name} className="flex flex-col gap-2 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.qty}</p>
                  </div>
                  <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">{item.expiresIn}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">What Can I Cook?</h2>
            <p className="mt-2 text-sm text-slate-500">Quick recipe ideas based on what's in your pantry.</p>
            <div className="mt-6 space-y-4">
              {suggestions.map((recipe) => (
                <div key={recipe.title} className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="font-semibold text-slate-900">{recipe.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* ── AI Assistant ─────────────────────────────────────────────── */}
        <section className="mt-8 rounded-[32px] border border-emerald-300 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white text-lg">✨</div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">SmartPantry AI Assistant</h2>
              <p className="text-sm text-slate-500">Knows what's in your fridge. Ask me anything about your ingredients or meals.</p>
            </div>
          </div>

          {/* Chat messages */}
          <div className="h-64 overflow-y-auto rounded-3xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-emerald-200 text-slate-700"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me what to cook, or what's expiring..."
              disabled={loading}
              className="flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </section>

        {/* Meal Plan */}
        <section className="mt-8 rounded-[32px] border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">This Week's Meal Plan</h2>
              <p className="mt-1 text-sm text-slate-500">A quick preview to help you stay organized.</p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              View full plan
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mealPlan.map((entry) => (
              <div key={entry.day} className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{entry.day}</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{entry.meal}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
