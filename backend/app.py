"""
SmartPantry - Flask REST API Backend with PostgreSQL
====================================================
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
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime, date, timedelta
import google.generativeai as genai
import os


# ══════════════════════════════════════════════════════════════════════════════
# APP + DATABASE CONFIG
# ══════════════════════════════════════════════════════════════════════════════

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "POSTGRES_DB_CONNECTION_STRING",
    "postgresql:///smartpantry_db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
swagger = Swagger(app)


# ══════════════════════════════════════════════════════════════════════════════
# DATABASE MODELS
# ══════════════════════════════════════════════════════════════════════════════

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Recipe(db.Model):
    __tablename__ = "recipes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    tags = db.Column(db.JSON, default=list)
    calories = db.Column(db.Integer, default=0)
    time = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.String(50), default="Easy")
    rating = db.Column(db.Float, default=0)
    ingredients = db.Column(db.JSON, default=list)
    instructions = db.Column(db.Text, default="")


class InventoryItem(db.Model):
    __tablename__ = "inventory_items"

    id = db.Column(db.Integer, primary_key=True)
    ingredient = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), default="Other")
    quantity = db.Column(db.String(80), default="1 unit")
    location = db.Column(db.String(80), default="Fridge")
    purchaseDate = db.Column(db.String(20))
    expiryDate = db.Column(db.String(20))
    handling = db.Column(db.Text, default="")


# ══════════════════════════════════════════════════════════════════════════════
# GEMINI AI SETUP
# ══════════════════════════════════════════════════════════════════════════════

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-3.1-flash-lite")
else:
    gemini_model = None


# ══════════════════════════════════════════════════════════════════════════════
# RULE ENGINE + HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

category_rules = {
    "Greens": 5,
    "Dairy": 7,
    "Bakery": 4,
    "Vegetables": 10,
    "Meat": 3,
    "Pantry": 180,
    "Other": 7
}


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


def recipe_to_dict(recipe):
    return {
        "id": recipe.id,
        "name": recipe.name,
        "tags": recipe.tags or [],
        "calories": recipe.calories,
        "time": recipe.time,
        "difficulty": recipe.difficulty,
        "rating": recipe.rating,
        "ingredients": recipe.ingredients or [],
        "instructions": recipe.instructions or ""
    }


def inventory_to_dict(item):
    return {
        "id": item.id,
        "ingredient": item.ingredient,
        "category": item.category,
        "quantity": item.quantity,
        "location": item.location,
        "purchaseDate": item.purchaseDate,
        "expiryDate": item.expiryDate,
        "handling": item.handling,
        "freshness": get_freshness(item.expiryDate)
    }


def seed_data():
    """Seed initial data only when database tables are empty."""

    if User.query.count() == 0:
        user = User(
            name="Liyi Wu",
            email="liyi@example.com",
            password="password123"
        )
        db.session.add(user)

    if Recipe.query.count() == 0:
        recipes = [
            Recipe(
                name="Avocado Toast",
                tags=["Breakfast", "Quick", "Vegetarian"],
                calories=320,
                time=15,
                difficulty="Easy",
                rating=4.6,
                ingredients=["Bread", "Avocado", "Lemon", "Chili Flakes"],
                instructions="Toast bread, mash avocado, season and serve."
            ),
            Recipe(
                name="One-Pan Veggie Pasta",
                tags=["Dinner", "Plant-based", "Comfort"],
                calories=450,
                time=30,
                difficulty="Medium",
                rating=4.8,
                ingredients=["Pasta", "Tomatoes", "Zucchini", "Basil"],
                instructions="Cook pasta, saute veggies, combine and serve."
            ),
            Recipe(
                name="Mango Quinoa Salad",
                tags=["Lunch", "Fresh", "Gluten-Free"],
                calories=280,
                time=20,
                difficulty="Easy",
                rating=4.4,
                ingredients=["Quinoa", "Mango", "Spinach", "Lime"],
                instructions="Cook quinoa, dice mango, mix with spinach and lime dressing."
            ),
        ]
        db.session.add_all(recipes)

    if InventoryItem.query.count() == 0:
        inventory_items = [
            InventoryItem(
                ingredient="Baby Spinach",
                category="Greens",
                quantity="1 bag",
                location="Fridge",
                purchaseDate="2026-07-08",
                expiryDate="2026-07-13",
                handling="Keep chilled"
            ),
            InventoryItem(
                ingredient="Greek Yogurt",
                category="Dairy",
                quantity="2 tubs",
                location="Fridge",
                purchaseDate="2026-07-09",
                expiryDate="2026-07-12",
                handling="Use soon"
            ),
            InventoryItem(
                ingredient="Tomato Sauce",
                category="Pantry",
                quantity="1 jar",
                location="Pantry",
                purchaseDate="2026-05-30",
                expiryDate="2026-06-20",
                handling="Discard if opened"
            ),
            InventoryItem(
                ingredient="Whole Wheat Bread",
                category="Bakery",
                quantity="1 loaf",
                location="Counter",
                purchaseDate="2026-07-10",
                expiryDate="2026-07-20",
                handling="Wrap tightly"
            ),
            InventoryItem(
                ingredient="Cherry Tomatoes",
                category="Vegetables",
                quantity="1 pint",
                location="Fridge",
                purchaseDate="2026-07-09",
                expiryDate="2026-07-18",
                handling="Rinse before use"
            ),
            InventoryItem(
                ingredient="Cheddar Cheese",
                category="Dairy",
                quantity="200g",
                location="Fridge",
                purchaseDate="2026-07-05",
                expiryDate="2026-07-25",
                handling="Keep sealed"
            ),
        ]
        db.session.add_all(inventory_items)

    db.session.commit()


# ══════════════════════════════════════════════════════════════════════════════
# HOME ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "SmartPantry Backend is running",
        "api_docs": "http://127.0.0.1:5000/apidocs/",
        "database": "PostgreSQL smartpantry_db",
        "endpoints": [
            "/api/register",
            "/api/login",
            "/api/recipes",
            "/api/inventory",
            "/api/dashboard",
            "/api/ai/chat"
        ]
    })


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
    data = request.get_json() or {}

    if not data.get("name") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Name, email and password are required"}), 400

    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    new_user = User(
        name=data["name"],
        email=data["email"],
        password=data["password"]
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
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
    data = request.get_json() or {}

    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(
        email=data["email"],
        password=data["password"]
    ).first()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
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
    recipes = Recipe.query.order_by(Recipe.id).all()
    results = [recipe_to_dict(recipe) for recipe in recipes]

    tag = request.args.get("tag")
    if tag and tag != "All":
        results = [r for r in results if tag in r["tags"]]

    max_calories = request.args.get("max_calories")
    if max_calories:
        results = [r for r in results if r["calories"] <= int(max_calories)]

    max_time = request.args.get("max_time")
    if max_time:
        results = [r for r in results if r["time"] <= int(max_time)]

    min_rating = request.args.get("min_rating")
    if min_rating:
        results = [r for r in results if r["rating"] >= float(min_rating)]

    search = request.args.get("search", "").lower()
    if search:
        results = [
            r for r in results
            if search in r["name"].lower()
            or any(search in ing.lower() for ing in r["ingredients"])
            or any(search in tag.lower() for tag in r["tags"])
        ]

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
    data = request.get_json() or {}

    if not data.get("name") or not data.get("ingredients"):
        return jsonify({"error": "Name and ingredients are required"}), 400

    new_recipe = Recipe(
        name=data["name"],
        tags=data.get("tags", []),
        calories=data.get("calories", 0),
        time=data.get("time", 0),
        difficulty=data.get("difficulty", "Easy"),
        rating=data.get("rating", 0),
        ingredients=data["ingredients"],
        instructions=data.get("instructions", "")
    )

    db.session.add(new_recipe)
    db.session.commit()

    return jsonify({
        "message": "Recipe added",
        "recipe": recipe_to_dict(new_recipe)
    }), 201


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
    recipe = db.session.get(Recipe, recipe_id)

    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404

    return jsonify(recipe_to_dict(recipe)), 200


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
    recipe = db.session.get(Recipe, recipe_id)

    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404

    data = request.get_json() or {}

    for key, value in data.items():
        if key == "id":
            continue
        if hasattr(recipe, key):
            setattr(recipe, key, value)

    db.session.commit()

    return jsonify({
        "message": "Recipe updated",
        "recipe": recipe_to_dict(recipe)
    }), 200


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
    recipe = db.session.get(Recipe, recipe_id)

    if not recipe:
        return jsonify({"error": f"Recipe {recipe_id} not found"}), 404

    db.session.delete(recipe)
    db.session.commit()

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
    inventory_items = InventoryItem.query.order_by(InventoryItem.id).all()

    results = [inventory_to_dict(item) for item in inventory_items]

    freshness_filter = request.args.get("freshness")
    if freshness_filter:
        results = [r for r in results if r["freshness"] == freshness_filter]

    location = request.args.get("location")
    if location:
        results = [r for r in results if r["location"] == location]

    summary = {
        "totalItems": len(results),
        "expiringSoon": sum(1 for r in results if r["freshness"] == "Expiring Soon"),
        "expired": sum(1 for r in results if r["freshness"] == "Expired"),
        "locations": len(set(r["location"] for r in results))
    }

    return jsonify({"items": results, "summary": summary}), 200


@app.route("/api/inventory", methods=["POST"])
def add_inventory():
    """Add a new ingredient to inventory with Auto-Expiry logic
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          properties:
            ingredient:
              type: string
              example: Lettuce
            category:
              type: string
              example: Greens
            quantity:
              type: string
              example: 1 head
            location:
              type: string
              example: Fridge
            purchaseDate:
              type: string
              example: "2026-07-14"
            expiryDate:
              type: string
              description: Leave blank to auto-calculate based on category.
              example: ""
            handling:
              type: string
              example: Keep crisp
    responses:
      201:
        description: Ingredient added smartly
      400:
        description: Missing required fields
    """
    data = request.get_json() or {}

    if not data.get("ingredient"):
        return jsonify({"error": "Ingredient name is required"}), 400

    purchase_date_str = data.get("purchaseDate", str(date.today()))
    category = data.get("category", "Other")
    expiry_date_str = data.get("expiryDate")

    if not expiry_date_str:
        shelf_life_days = category_rules.get(category, 7)
        purchase_date_obj = datetime.strptime(purchase_date_str, "%Y-%m-%d").date()
        expiry_date_obj = purchase_date_obj + timedelta(days=shelf_life_days)
        expiry_date_str = str(expiry_date_obj)

    new_item = InventoryItem(
        ingredient=data["ingredient"],
        category=category,
        quantity=data.get("quantity", "1 unit"),
        location=data.get("location", "Fridge"),
        purchaseDate=purchase_date_str,
        expiryDate=expiry_date_str,
        handling=data.get("handling", "")
    )

    db.session.add(new_item)
    db.session.commit()

    return jsonify({
        "message": "Ingredient added smartly",
        "item": inventory_to_dict(new_item)
    }), 201


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
    item = db.session.get(InventoryItem, item_id)

    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    return jsonify(inventory_to_dict(item)), 200


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
    item = db.session.get(InventoryItem, item_id)

    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    data = request.get_json() or {}

    for key, value in data.items():
        if key == "id":
            continue
        if hasattr(item, key):
            setattr(item, key, value)

    db.session.commit()

    return jsonify({
        "message": "Item updated",
        "item": inventory_to_dict(item)
    }), 200


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
    item = db.session.get(InventoryItem, item_id)

    if not item:
        return jsonify({"error": f"Item {item_id} not found"}), 404

    db.session.delete(item)
    db.session.commit()

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
    inventory_items = InventoryItem.query.order_by(InventoryItem.id).all()
    recipes = Recipe.query.order_by(Recipe.id).all()

    items_with_freshness = [inventory_to_dict(item) for item in inventory_items]

    expiring_soon = [
        i for i in items_with_freshness
        if i["freshness"] == "Expiring Soon"
    ]

    expired = [
        i for i in items_with_freshness
        if i["freshness"] == "Expired"
    ]

    expiring_names = [i["ingredient"].lower() for i in expiring_soon]

    suggested_recipes = []
    for recipe in recipes:
        recipe_dict = recipe_to_dict(recipe)
        recipe_ings = [ing.lower() for ing in recipe_dict["ingredients"]]

        if any(exp in " ".join(recipe_ings) for exp in expiring_names):
            suggested_recipes.append(recipe_dict)

    return jsonify({
        "summary": {
            "expiringSoon": len(expiring_soon),
            "savedRecipes": len(recipes),
            "totalInventory": len(inventory_items)
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
    data = request.get_json() or {}

    if not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    inventory_items = InventoryItem.query.order_by(InventoryItem.id).all()
    recipes = Recipe.query.order_by(Recipe.id).all()

    items_with_freshness = [inventory_to_dict(item) for item in inventory_items]
    recipe_dicts = [recipe_to_dict(recipe) for recipe in recipes]

    expiring = [i for i in items_with_freshness if i["freshness"] == "Expiring Soon"]
    expired = [i for i in items_with_freshness if i["freshness"] == "Expired"]

    inventory_text = "\n".join(
        f"- {i['ingredient']}: {i['quantity']}, expires {i['expiryDate']} [{i['freshness']}]"
        for i in items_with_freshness
    )

    recipes_text = "\n".join(
        f"- {r['name']} ({', '.join(r['tags'])}) — ingredients: {', '.join(r['ingredients'])}"
        for r in recipe_dicts
    )

    prompt = f"""You are SmartPantry Assistant, a friendly AI kitchen helper.
You have live access to the user's fridge and pantry data shown below.
Always give personalized advice based on their actual ingredients.
Prioritize items that are expiring soon to help reduce food waste.
Keep responses concise (2-4 sentences), warm and actionable.

CURRENT INVENTORY ({len(items_with_freshness)} items):
{inventory_text}

EXPIRING SOON ({len(expiring)} items): {', '.join(i['ingredient'] for i in expiring) or 'None'}
EXPIRED ({len(expired)} items): {', '.join(i['ingredient'] for i in expired) or 'None'}

SAVED RECIPES ({len(recipe_dicts)} recipes):
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
    with app.app_context():
        db.create_all()
        seed_data()

    print("=" * 50)
    print("SmartPantry Backend running!")
    print("API docs: http://127.0.0.1:5000/apidocs/")
    print("Database: PostgreSQL smartpantry_db")
    print("=" * 50)

    app.run(debug=True)