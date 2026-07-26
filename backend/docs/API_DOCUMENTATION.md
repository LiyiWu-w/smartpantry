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
    "calories": 400,
    "time": 20,
    "difficulty": "Easy",
    "rating": 4.5
  }
}
```

## PUT /api/recipes/{id}

Purpose: Update an existing recipe.

Sample input:

```json
{
  "calories": 420,
  "rating": 4.8
}
```

Sample database result:

```text
4 | Egg Fried Rice | 420 | 4.8
```

## DELETE /api/recipes/{id}

Purpose: Delete a recipe from the database.

Sample output:

```json
{
  "message": "Recipe 4 deleted"
}
```

After deletion, Egg Fried Rice no longer appears in the recipes table.

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
    "freshness": "Fresh"
  }
}
```

## PUT /api/inventory/{id}

Purpose: Update an inventory item.

Sample input:

```json
{
  "quantity": "10 count",
  "handling": "Use within one week after opening."
}
```

Sample database result:

```text
7 | Eggs | 10 count | Use within one week after opening.
```

## DELETE /api/inventory/{id}

Purpose: Delete an inventory item from the database.

Sample output:

```json
{
  "message": "Item 7 deleted"
}
```

After deletion, Eggs no longer appears in the inventory_items table.

## GET /api/dashboard

Purpose: Return dashboard metrics from the recipes and inventory_items tables.

Sample output:

```json
{
  "summary": {
    "expiringSoon": 0,
    "savedRecipes": 3,
    "totalInventory": 6
  },
  "expiringItems": [],
  "suggestedRecipes": []
}
```

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