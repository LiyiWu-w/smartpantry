# SmartPantry API Documentation

## Overview

SmartPantry backend is a Flask REST API connected to a PostgreSQL database. It supports user authentication, recipe CRUD, inventory CRUD, dashboard summary, and AI assistant features.

Base URL:

```text
http://127.0.0.1:5000
```

## API List

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/register | Register a user |
| POST | /api/login | Login a user |
| GET | /api/recipes | Get all recipes |
| POST | /api/recipes | Add a recipe |
| GET | /api/recipes/{id} | Get one recipe |
| PUT | /api/recipes/{id} | Update a recipe |
| DELETE | /api/recipes/{id} | Delete a recipe |
| GET | /api/inventory | Get all inventory items |
| POST | /api/inventory | Add an inventory item |
| GET | /api/inventory/{id} | Get one inventory item |
| PUT | /api/inventory/{id} | Update an inventory item |
| DELETE | /api/inventory/{id} | Delete an inventory item |
| GET | /api/dashboard | Get dashboard summary |
| POST | /api/ai/chat | Get AI assistant response |

---

## POST /api/register

Purpose: Register a new user.

Sample input:

```json
{
  "name": "Liyi Wu",
  "email": "liyi@example.com",
  "password": "password123"
}
```

Sample output:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Liyi Wu",
    "email": "liyi@example.com"
  }
}
```

---

## POST /api/login

Purpose: Log in an existing user.

Sample input:

```json
{
  "email": "liyi@example.com",
  "password": "password123"
}
```

Sample output:

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Liyi Wu",
    "email": "liyi@example.com"
  }
}
```

---

## GET /api/recipes

Purpose: Retrieve all recipes from the PostgreSQL recipes table.

Sample input:

No request body is required.

Optional query parameters:

```text
tag=Breakfast
max_calories=400
max_time=30
min_rating=4.0
search=pasta
```

Sample output:

```json
{
  "count": 3,
  "recipes": [
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
    }
  ]
}
```

---

## POST /api/recipes

Purpose: Add a new recipe to the PostgreSQL recipes table.

Sample input:

```json
{
  "name": "Egg Fried Rice",
  "tags": ["Dinner", "Quick"],
  "calories": 400,
  "time": 20,
  "difficulty": "Easy",
  "rating": 4.5,
  "ingredients": ["Eggs", "Rice", "Soy Sauce"],
  "instructions": "Cook rice with eggs and soy sauce."
}
```

Sample output:

```json
{
  "message": "Recipe added",
  "recipe": {
    "id": 4,
    "name": "Egg Fried Rice",
    "tags": ["Dinner", "Quick"],
    "calories": 400,
    "time": 20,
    "difficulty": "Easy",
    "rating": 4.5,
    "ingredients": ["Eggs", "Rice", "Soy Sauce"],
    "instructions": "Cook rice with eggs and soy sauce."
  }
}
```

---

## GET /api/recipes/{id}

Purpose: Retrieve one recipe by ID.

Sample input:

No request body is required.

Example endpoint:

```text
GET /api/recipes/1
```

Sample output:

```json
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
}
```

---

## PUT /api/recipes/{id}

Purpose: Update an existing recipe.

Sample input:

```json
{
  "calories": 420,
  "rating": 4.8
}
```

Sample output:

```json
{
  "message": "Recipe updated",
  "recipe": {
    "id": 4,
    "name": "Egg Fried Rice",
    "tags": ["Dinner", "Quick"],
    "calories": 420,
    "time": 20,
    "difficulty": "Easy",
    "rating": 4.8,
    "ingredients": ["Eggs", "Rice", "Soy Sauce"],
    "instructions": "Cook rice with eggs and soy sauce."
  }
}
```

Database verification example:

```text
4 | Egg Fried Rice | 420 | 4.8
```

---

## DELETE /api/recipes/{id}

Purpose: Delete a recipe from the database.

Sample input:

No request body is required.

Example endpoint:

```text
DELETE /api/recipes/4
```

Sample output:

```json
{
  "message": "Recipe 4 deleted"
}
```

Database verification:

```text
After deletion, Egg Fried Rice no longer appears in the recipes table.
```

---

## GET /api/inventory

Purpose: Retrieve all inventory items with freshness status and summary data.

Sample input:

No request body is required.

Optional query parameters:

```text
freshness=Expired
location=Fridge
```

Sample output:

```json
{
  "items": [
    {
      "id": 1,
      "ingredient": "Baby Spinach",
      "category": "Greens",
      "quantity": "1 bag",
      "location": "Fridge",
      "purchaseDate": "2026-07-08",
      "expiryDate": "2026-07-13",
      "handling": "Keep chilled",
      "freshness": "Expired"
    },
    {
      "id": 2,
      "ingredient": "Greek Yogurt",
      "category": "Dairy",
      "quantity": "2 tubs",
      "location": "Fridge",
      "purchaseDate": "2026-07-09",
      "expiryDate": "2026-07-12",
      "handling": "Use soon",
      "freshness": "Expired"
    }
  ],
  "summary": {
    "totalItems": 6,
    "expiringSoon": 0,
    "expired": 6,
    "locations": 3
  }
}
```

---

## POST /api/inventory

Purpose: Add a new inventory item. If expiryDate is blank, the backend automatically calculates the expiry date based on the category.

Sample input:

```json
{
  "ingredient": "Eggs",
  "category": "Dairy",
  "quantity": "12 count",
  "location": "Fridge",
  "purchaseDate": "2026-07-26",
  "expiryDate": "",
  "handling": "Keep refrigerated."
}
```

Sample output:

```json
{
  "message": "Ingredient added smartly",
  "item": {
    "id": 7,
    "ingredient": "Eggs",
    "category": "Dairy",
    "quantity": "12 count",
    "location": "Fridge",
    "purchaseDate": "2026-07-26",
    "expiryDate": "2026-08-02",
    "handling": "Keep refrigerated.",
    "freshness": "Fresh"
  }
}
```

---

## GET /api/inventory/{id}

Purpose: Retrieve one inventory item by ID.

Sample input:

No request body is required.

Example endpoint:

```text
GET /api/inventory/1
```

Sample output:

```json
{
  "id": 1,
  "ingredient": "Baby Spinach",
  "category": "Greens",
  "quantity": "1 bag",
  "location": "Fridge",
  "purchaseDate": "2026-07-08",
  "expiryDate": "2026-07-13",
  "handling": "Keep chilled",
  "freshness": "Expired"
}
```

---

## PUT /api/inventory/{id}

Purpose: Update an inventory item.

Sample input:

```json
{
  "quantity": "10 count",
  "handling": "Use within one week after opening."
}
```

Sample output:

```json
{
  "message": "Item updated",
  "item": {
    "id": 7,
    "ingredient": "Eggs",
    "category": "Dairy",
    "quantity": "10 count",
    "location": "Fridge",
    "purchaseDate": "2026-07-26",
    "expiryDate": "2026-08-02",
    "handling": "Use within one week after opening.",
    "freshness": "Fresh"
  }
}
```

Database verification example:

```text
7 | Eggs | 10 count | Use within one week after opening.
```

---

## DELETE /api/inventory/{id}

Purpose: Delete an inventory item from the database.

Sample input:

No request body is required.

Example endpoint:

```text
DELETE /api/inventory/7
```

Sample output:

```json
{
  "message": "Item 7 deleted"
}
```

Database verification:

```text
After deletion, Eggs no longer appears in the inventory_items table.
```

---

## GET /api/dashboard

Purpose: Return dashboard metrics from the recipes and inventory_items tables.

Sample input:

No request body is required.

Sample output:

```json
{
  "summary": {
    "expiringSoon": 0,
    "savedRecipes": 3,
    "totalInventory": 6
  },
  "expiredItems": [
    {
      "id": 1,
      "ingredient": "Baby Spinach",
      "category": "Greens",
      "quantity": "1 bag",
      "location": "Fridge",
      "purchaseDate": "2026-07-08",
      "expiryDate": "2026-07-13",
      "handling": "Keep chilled",
      "freshness": "Expired"
    }
  ],
  "expiringItems": [],
  "suggestedRecipes": []
}
```

---

## POST /api/ai/chat

Purpose: Return a SmartPantry AI assistant response based on inventory and recipe data.

Sample input:

```json
{
  "message": "What should I cook tonight?"
}
```

Sample output in demo mode:

```json
{
  "reply": "AI Assistant is running in demo mode. The backend API is ready, but the Gemini API key is not configured."
}
```