"""
SmartPantry - Flask REST API Backend
=====================================
Run:  python app.py
Docs: http://127.0.0.1:5000/apidocs/

Endpoints:
  Auth:      POST /api/register, POST /api/login
  Recipes:   GET/POST /api/recipes, GET/PUT/DELETE /api/recipes/<id>
  Inventory: GET/POST /api/inventory, GET/PUT/DELETE /api/inventory/<id>
  AI:        POST /api/ai/chat
  Dashboard: GET /api/dashboard
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flasgger import Swagger
from datetime import datetime, date
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API
swagger = Swagger(app)

# ── Gemini AI setup ───────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-3.1-flash-lite")
else:
    gemini_model = None

# ── In-memory data store (will replace with PostgreSQL in M3) ─────────────────
users_db = [
    {"id": 1, "name": "Liyi Wu", "email": "liyi@example.com", "password": "password123"}
]

recipes_db = [
    {
        "id": 1,
        "name": "Avocado Toast",
        "tags": ["Breakfast", "Quick", "Vegetarian"],
        "calories": 320,
        "time": 15,
        "difficulty": "Easy",
        "rating": 4.6,
        "ingredients": ["Bread", "Avocado", "Lemon", "Chili Flakes"],
        "instructions": "Toast bread, mash avocado, season and serve."
    },
    {
        "id": 2,
        "name": "One-Pan Veggie Pasta",
        "tags": ["Dinner", "Plant-based", "Comfort"],
        "calories": 450,
        "time": 30,
        "difficulty": "Medium",
        "rating": 4.8,
        "ingredients": ["Pasta", "Tomatoes", "Zucchini", "Basil"],
        "instructions": "Cook pasta, saute veggies, combine and serve."
    },
    {
        "id": 3,
        "name": "Mango Quinoa Salad",
        "tags": ["Lunch", "Fresh", "Gluten-Free"],
        "calories": 280,
        "time": 20,
        "difficulty": "Easy",
        "rating": 4.4,
        "ingredients": ["Quinoa", "Mango", "Spinach", "Lime"],
        "instructions": "Cook quinoa, dice mango, mix with spinach and lime dressing."
    },
]

inventory_db = [
    {
        "id": 1,
        "ingredient": "Baby Spinach",
        "category": "Greens",
        "quantity": "1 bag",
        "location": "Fridge",
        "purchaseDate": "2026-07-08",
        "expiryDate": "2026-07-13",
        "handling": "Keep chilled"
    },
    {
        "id": 2,
        "ingredient": "Greek Yogurt",
        "category": "Dairy",
        "quantity": "2 tubs",
        "location": "Fridge",
        "purchaseDate": "2026-07-09",
        "expiryDate": "2026-07-12",
        "handling": "Use soon"
    },
    {
        "id": 3,
        "ingredient": "Tomato Sauce",
        "category": "Pantry",
        "quantity": "1 jar",
        "location": "Pantry",
        "purchaseDate": "2026-05-30",
        "expiryDate": "2026-06-20",
        "handling": "Discard if opened"
    },
    {
        "id": 4,
        "ingredient": "Whole Wheat Bread",
        "category": "Bakery",
        "quantity": "1 loaf",
        "location": "Counter",
        "purchaseDate": "2026-07-10",
        "expiryDate": "2026-07-20",
        "handling": "Wrap tightly"
    },
    {
        "id": 5,
        "ingredient": "Cherry Tomatoes",
        "category": "Vegetables",
        "quantity": "1 pint",
        "location": "Fridge",
        "purchaseDate": "2026-07-09",
        "expiryDate": "2026-07-18",
        "handling": "Rinse before use"
    },
    {
        "id": 6,
        "ingredient": "Cheddar Cheese",
        "category": "Dairy",
        "quantity": "200g",
        "location": "Fridge",
        "purchaseDate": "2026-07-05",
        "expiryDate": "2026-07-25",
        "handling": "Keep sealed"
    },
]

# ── Helper functions ──────────────────────────────────────────────────────────
def get_freshness(expiry_date_str):
    """Calculate freshness status based on expiry date."""
    try:
        expiry = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
        today = date.today()
        diff = (expiry - today).days
        if diff < 0:
            return "Expired"
        elif diff <= 3:
            return "Expiring Soon"
        else:
            return "Fresh"
    except Exception:
        return "Unknown"

def next_id(db):
    """Generate next ID for in-memory database."""
    return max((item["id"] for item in db), default=0) + 1


# ══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/register", methods=["POST"])
def register():
    """Register a new user
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            name:
              type: string
              example: Liyi Wu
            email:
              type: string
              example: liyi@example.com
            password:
              type: string
              example: password123
    responses:
      201:
        description: User registered successfully
      400:
        description: Missing fields or email already exists
    """
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Name, email and password are required"}), 400

    # Check if email already exists
    if any(u["email"] == data["email"] for u in users_db):
        return jsonify({"error": "Email already registered"}), 400

    new_user = {
        "id": next_id(users_db),
        "name": data["name"],
        "email": data["email"],
        "password": data["password"]  # In production: hash this!
    }
    users_db.append(new_user)
    return jsonify({
        "message": "User registered successfully",
        "user": {"id": new_user["id"], "name": new_user["name"], "email": new_user["email"]}
    }), 201


@app.route("/api/login", methods=["POST"])
def login():
    """Login with email and password
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            email:
              type: string
              example: liyi@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Login successful
      401:
        description: Invalid credentials
    """
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = next((u for u in users_db
                 if u["email"] == data["email"] and u["password"] == data["password"]), None)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# RECIPE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/recipes", methods=["GET"])
def get_recipes():
    """Get all recipes with optional filters
    ---
    parameters:
      - name: tag
        in: query
        type: string
        example: Breakfast
      - name: max_calories
        in: query
        type: integer
        example: 400
      - name: max_time
        in: query
        type: integer
        example: 30
      - name: min_rating
        in: query
        type: number
        example: 4.0
      - name: search
        in: query
        type: string
        example: pasta
    responses:
      200:
        description: List of recipes
    """
    results = list(recipes_db)

    # Filter by tag
    tag = request.args.get("tag")
    if tag and tag != "All":
        results = [r for r in results if tag in r["tags"]]

    # Filter by max calories
    max_calories = request.args.get("max_calories")
    if max_calories:
        results = [r for r in results if r["calories"] <= int(max_calories)]

    # Filter by max cooking time
    max_time = request.args.get("max_time")
    if max_time:
        results = [r for r in results if r["time"] <= int(max_time)]

    # Filter by min rating
    min_rating = request.args.get("min_rating")
    if min_rating:
        results = [r for r in results if r["rating"] >= float(min_rating)]

    # Search by name or ingredient
    search = request.args.get("search", "").lower()
    if search:
        results = [r for r in results if
                   search in r["name"].lower() or
                   any(search in ing.lower() for ing in r["ingredients"]) or
                   any(search in tag.lower() for tag in r["tags"])]

    return jsonify({"recipes": results, "count": len(results)}), 200


@app.route("/api/recipes", methods=["POST"])
def add_recipe():
    """Add a new recipe
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            name:
              type: string
              example: Avocado Toast
            tags:
              type: array
              items:
                type: string
              example: ["Breakfast", "Quick"]
            calories:
              type: integer
              example: 320
            time:
              type: integer
              example: 15
            difficulty:
              type: string
              example: Easy
            rating:
              type: number
              example: 4.5
            ingredients:
              type: array
              items:
                type: string
              example: ["Bread", "Avocado"]
            instructions:
              type: string
              example: Toast bread and mash avocado on top.
    responses:
      201:
        description: Recipe created
      400:
        description: Missing required fields
    """
    data = request.get_json()
    if not data or not data.get("name") or not data.get("ingredients"):
        return jsonify({"error": "Name and ingredients are required"}), 400

    new_recipe = {
        "id": next_id(recipes_db),
        "name": data["name"],
        "tags": data.get("tags", []),
        "calories": data.get("calories", 0),
        "time": data.get("time", 0),
        "difficulty": data.get("difficulty", "Easy"),
        "rating": data.get("rating", 0),
        "ingredients": data["ingredients"],
        "instructions": data.get("instructions", "")
    }
    recipes_db.append(new_recipe)
    return jsonify({"message": "Recipe added", "recipe": new_recipe}), 201


@app.route("/api/recipes/<int:recipe_id>", methods=["GET"])
def get_recipe(recipe_id):
    """Get a single recipe by ID
    ---
    parameters:
      - name: recipe_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Recipe found
      404:
        description: Recipe not found
    """
    recipe = next((r for r in recipes_db if r["id"] == recipe_id), None)
    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404
    return jsonify(recipe), 200


@app.route("/api/recipes/<int:recipe_id>", methods=["PUT"])
def update_recipe(recipe_id):
    """Update an existing recipe
    ---
    parameters:
      - name: recipe_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          properties:
            name:
              type: string
            calories:
              type: integer
            rating:
              type: number
    responses:
      200:
        description: Recipe updated
      404:
        description: Recipe not found
    """
    recipe = next((r for r in recipes_db if r["id"] == recipe_id), None)
    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404

    data = request.get_json()
    recipe.update({k: v for k, v in data.items() if k != "id"})
    return jsonify({"message": "Recipe updated", "recipe": recipe}), 200


@app.route("/api/recipes/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    """Delete a recipe by ID
    ---
    parameters:
      - name: recipe_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Recipe deleted
      404:
        description: Recipe not found
    """
    global recipes_db
    recipe = next((r for r in recipes_db if r["id"] == recipe_id), None)
    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404

    recipes_db = [r for r in recipes_db if r["id"] != recipe_id]
    return jsonify({"message": f"Recipe {recipe_id} deleted"}), 200


# ══════════════════════════════════════════════════════════════════════════════
# INVENTORY ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    """Get all inventory items with freshness status
    ---
    parameters:
      - name: freshness
        in: query
        type: string
        example: Expiring Soon
      - name: location
        in: query
        type: string
        example: Fridge
    responses:
      200:
        description: List of inventory items with freshness status
    """
    results = []
    for item in inventory_db:
        item_with_freshness = dict(item)
        item_with_freshness["freshness"] = get_freshness(item["expiryDate"])
        results.append(item_with_freshness)

    # Filter by freshness
    freshness_filter = request.args.get("freshness")
    if freshness_filter:
        results = [r for r in results if r["freshness"] == freshness_filter]

    # Filter by location
    location = request.args.get("location")
    if location:
        results = [r for r in results if r["location"] == location]

    # Summary stats
    summary = {
        "totalItems": len(results),
        "expiringSoon": sum(1 for r in results if r["freshness"] == "Expiring Soon"),
        "expired": sum(1 for r in results if r["freshness"] == "Expired"),
        "locations": len(set(r["location"] for r in results))
    }

    return jsonify({"items": results, "summary": summary}), 200


@app.route("/api/inventory", methods=["POST"])
def add_inventory():
    """Add a new ingredient to inventory
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            ingredient:
              type: string
              example: Baby Spinach
            category:
              type: string
              example: Greens
            quantity:
              type: string
              example: 1 bag
            location:
              type: string
              example: Fridge
            purchaseDate:
              type: string
              example: "2026-07-10"
            expiryDate:
              type: string
              example: "2026-07-15"
            handling:
              type: string
              example: Keep chilled
    responses:
      201:
        description: Ingredient added
      400:
        description: Missing required fields
    """
    data = request.get_json()
    if not data or not data.get("ingredient") or not data.get("expiryDate"):
        return jsonify({"error": "Ingredient name and expiry date are required"}), 400

    new_item = {
        "id": next_id(inventory_db),
        "ingredient": data["ingredient"],
        "category": data.get("category", ""),
        "quantity": data.get("quantity", ""),
        "location": data.get("location", "Fridge"),
        "purchaseDate": data.get("purchaseDate", str(date.today())),
        "expiryDate": data["expiryDate"],
        "handling": data.get("handling", "")
    }
    inventory_db.append(new_item)

    new_item_with_freshness = dict(new_item)
    new_item_with_freshness["freshness"] = get_freshness(new_item["expiryDate"])
    return jsonify({"message": "Ingredient added", "item": new_item_with_freshness}), 201


@app.route("/api/inventory/<int:item_id>", methods=["GET"])
def get_inventory_item(item_id):
    """Get a single inventory item by ID
    ---
    parameters:
      - name: item_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Item found
      404:
        description: Item not found
    """
    item = next((i for i in inventory_db if i["id"] == item_id), None)
    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    item_with_freshness = dict(item)
    item_with_freshness["freshness"] = get_freshness(item["expiryDate"])
    return jsonify(item_with_freshness), 200


@app.route("/api/inventory/<int:item_id>", methods=["PUT"])
def update_inventory(item_id):
    """Update an inventory item
    ---
    parameters:
      - name: item_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          properties:
            quantity:
              type: string
            expiryDate:
              type: string
            handling:
              type: string
    responses:
      200:
        description: Item updated
      404:
        description: Item not found
    """
    item = next((i for i in inventory_db if i["id"] == item_id), None)
    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    data = request.get_json()
    item.update({k: v for k, v in data.items() if k != "id"})

    item_with_freshness = dict(item)
    item_with_freshness["freshness"] = get_freshness(item["expiryDate"])
    return jsonify({"message": "Item updated", "item": item_with_freshness}), 200


@app.route("/api/inventory/<int:item_id>", methods=["DELETE"])
def delete_inventory(item_id):
    """Delete an inventory item
    ---
    parameters:
      - name: item_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Item deleted
      404:
        description: Item not found
    """
    global inventory_db
    item = next((i for i in inventory_db if i["id"] == item_id), None)
    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    inventory_db = [i for i in inventory_db if i["id"] != item_id]
    return jsonify({"message": f"Item {item_id} deleted"}), 200


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Get dashboard summary data
    ---
    responses:
      200:
        description: Dashboard summary including expiring items and recipe suggestions
    """
    # Get items with freshness
    items_with_freshness = []
    for item in inventory_db:
        i = dict(item)
        i["freshness"] = get_freshness(item["expiryDate"])
        items_with_freshness.append(i)

    expiring_soon = [i for i in items_with_freshness if i["freshness"] == "Expiring Soon"]
    expired = [i for i in items_with_freshness if i["freshness"] == "Expired"]

    # Simple recipe matching based on expiring ingredients
    expiring_names = [i["ingredient"].lower() for i in expiring_soon]
    suggested_recipes = []
    for recipe in recipes_db:
        recipe_ings = [ing.lower() for ing in recipe["ingredients"]]
        if any(exp in " ".join(recipe_ings) for exp in expiring_names):
            suggested_recipes.append(recipe)

    return jsonify({
        "summary": {
            "expiringSoon": len(expiring_soon),
            "savedRecipes": len(recipes_db),
            "totalInventory": len(inventory_db)
        },
        "expiringItems": expiring_soon,
        "expiredItems": expired,
        "suggestedRecipes": suggested_recipes[:3]
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# AI ASSISTANT ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    """Chat with SmartPantry AI Assistant
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            message:
              type: string
              example: What should I cook tonight?
    responses:
      200:
        description: AI response
      400:
        description: Missing message
      500:
        description: AI service error
    """
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    # Build live context from current database
    items_with_freshness = []
    for item in inventory_db:
        i = dict(item)
        i["freshness"] = get_freshness(item["expiryDate"])
        items_with_freshness.append(i)

    expiring = [i for i in items_with_freshness if i["freshness"] == "Expiring Soon"]
    expired  = [i for i in items_with_freshness if i["freshness"] == "Expired"]
    fresh    = [i for i in items_with_freshness if i["freshness"] == "Fresh"]

    inventory_text = "\n".join(
        f"- {i['ingredient']}: {i['quantity']}, expires {i['expiryDate']} [{i['freshness']}]"
        for i in items_with_freshness
    )
    recipes_text = "\n".join(
        f"- {r['name']} ({', '.join(r['tags'])}) — ingredients: {', '.join(r['ingredients'])}"
        for r in recipes_db
    )

    prompt = f"""You are SmartPantry Assistant, a friendly AI kitchen helper.
You have live access to the user's fridge and pantry data shown below.
Always give personalized advice based on their actual ingredients.
Prioritize items that are expiring soon to help reduce food waste.
Keep responses concise (2-4 sentences), warm and actionable.

CURRENT INVENTORY ({len(inventory_db)} items):
{inventory_text}

EXPIRING SOON ({len(expiring)} items): {', '.join(i['ingredient'] for i in expiring) or 'None'}
EXPIRED ({len(expired)} items): {', '.join(i['ingredient'] for i in expired) or 'None'}

SAVED RECIPES ({len(recipes_db)} recipes):
{recipes_text}

User question: {data['message']}"""
    if gemini_model is None:
        return jsonify({
            "reply": "AI Assistant is running in demo mode. The backend API is ready, but the Gemini API key is not configured."
        }), 200

    try:
        response = gemini_model.generate_content(prompt)
        return jsonify({"reply": response.text}), 200
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 500


# ══════════════════════════════════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 50)
    print("SmartPantry Backend running!")
    print("API docs: http://127.0.0.1:5000/apidocs/")
    print("=" * 50)
    app.run(debug=True)
