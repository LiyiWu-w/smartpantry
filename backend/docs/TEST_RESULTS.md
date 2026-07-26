# SmartPantry API Test Results

## Overview

This document summarizes the backend API testing results for SmartPantry Milestone 2. The tests verify that the Flask REST APIs are connected to the PostgreSQL database and that each CRUD operation is reflected in the database.

Testing tools:

```text
cURL
PostgreSQL psql terminal
Flasgger API docs
```

Backend base URL:

```text
http://127.0.0.1:5000
```

Database:

```text
smartpantry_db
```

## Database Setup Verification

The PostgreSQL database contains three tables:

```text
inventory_items
recipes
users
```

Initial seed data:

```text
recipes: 3 rows
inventory_items: 6 rows
users: 1 row
```

Status: Passed

## Test Summary

| Test Case | Method | Endpoint | Expected Result | Database Evidence | Status |
|---|---|---|---|---|---|
| Get recipes | GET | /api/recipes | Return recipe list | 3 recipes available | Passed |
| Add recipe | POST | /api/recipes | Add Egg Fried Rice | Row ID 4 appeared in recipes table | Passed |
| Update recipe | PUT | /api/recipes/4 | Update calories and rating | Calories changed to 420, rating changed to 4.8 | Passed |
| Delete recipe | DELETE | /api/recipes/4 | Delete Egg Fried Rice | Row ID 4 removed from recipes table | Passed |
| Get inventory | GET | /api/inventory | Return inventory list | 6 inventory items available | Passed |
| Add inventory item | POST | /api/inventory | Add Eggs | Row ID 7 appeared in inventory_items table | Passed |
| Auto-expiry | POST | /api/inventory | Calculate expiry date | Dairy item expiry date became 2026-08-02 | Passed |
| Update inventory item | PUT | /api/inventory/7 | Update quantity and handling | Quantity changed to 10 count and handling updated | Passed |
| Delete inventory item | DELETE | /api/inventory/7 | Delete Eggs | Row ID 7 removed from inventory_items table | Passed |
| Dashboard summary | GET | /api/dashboard | Return dashboard metrics | savedRecipes 3, totalInventory 6 | Passed |

## Recipe CRUD Tests

### 1. POST /api/recipes

Purpose: Add a new recipe.

cURL request:

```bash
curl -X POST http://127.0.0.1:5000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Egg Fried Rice",
    "tags": ["Dinner", "Quick"],
    "calories": 400,
    "time": 20,
    "difficulty": "Easy",
    "rating": 4.5,
    "ingredients": ["Eggs", "Rice", "Soy Sauce"],
    "instructions": "Cook rice with eggs and soy sauce."
  }'
```

API result:

```text
Recipe added with ID 4
```

Database verification query:

```sql
SELECT id, name, calories, time, difficulty, rating FROM recipes ORDER BY id;
```

Database result:

```text
4 | Egg Fried Rice | 400 | 20 | Easy | 4.5
```

Status: Passed

### 2. PUT /api/recipes/4

Purpose: Update the recipe calories and rating.

cURL request:

```bash
curl -X PUT http://127.0.0.1:5000/api/recipes/4 \
  -H "Content-Type: application/json" \
  -d '{
    "calories": 420,
    "rating": 4.8
  }'
```

Database verification query:

```sql
SELECT id, name, calories, rating FROM recipes WHERE id = 4;
```

Database result:

```text
4 | Egg Fried Rice | 420 | 4.8
```

Status: Passed

### 3. DELETE /api/recipes/4

Purpose: Delete the recipe.

cURL request:

```bash
curl -X DELETE http://127.0.0.1:5000/api/recipes/4
```

Database verification query:

```sql
SELECT id, name, calories, rating FROM recipes ORDER BY id;
```

Database result:

```text
1 | Avocado Toast | 320 | 4.6
2 | One-Pan Veggie Pasta | 450 | 4.8
3 | Mango Quinoa Salad | 280 | 4.4
```

Egg Fried Rice no longer appeared in the table.

Status: Passed

## Inventory CRUD Tests

### 4. POST /api/inventory

Purpose: Add a new inventory item and test auto-expiry logic.

cURL request:

```bash
curl -X POST http://127.0.0.1:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient": "Eggs",
    "category": "Dairy",
    "quantity": "12 count",
    "location": "Fridge",
    "purchaseDate": "2026-07-26",
    "expiryDate": "",
    "handling": "Keep refrigerated."
  }'
```

Database verification query:

```sql
SELECT id, ingredient, category, quantity, location, "purchaseDate", "expiryDate"
FROM inventory_items
ORDER BY id;
```

Database result:

```text
7 | Eggs | Dairy | 12 count | Fridge | 2026-07-26 | 2026-08-02
```

Auto-expiry evidence:

```text
Dairy shelf life = 7 days
2026-07-26 + 7 days = 2026-08-02
```

Status: Passed

### 5. PUT /api/inventory/7

Purpose: Update quantity and handling instructions.

cURL request:

```bash
curl -X PUT http://127.0.0.1:5000/api/inventory/7 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": "10 count",
    "handling": "Use within one week after opening."
  }'
```

Database verification query:

```sql
SELECT id, ingredient, quantity, handling
FROM inventory_items
WHERE id = 7;
```

Database result:

```text
7 | Eggs | 10 count | Use within one week after opening.
```

Status: Passed

### 6. DELETE /api/inventory/7

Purpose: Delete the inventory item.

cURL request:

```bash
curl -X DELETE http://127.0.0.1:5000/api/inventory/7
```

Database verification query:

```sql
SELECT id, ingredient, quantity
FROM inventory_items
ORDER BY id;
```

Database result:

```text
1 | Baby Spinach | 1 bag
2 | Greek Yogurt | 2 tubs
3 | Tomato Sauce | 1 jar
4 | Whole Wheat Bread | 1 loaf
5 | Cherry Tomatoes | 1 pint
6 | Cheddar Cheese | 200g
```

Eggs no longer appeared in the table.

Status: Passed

## Dashboard API Test

### 7. GET /api/dashboard

Purpose: Return dashboard metrics from the recipes and inventory_items tables.

cURL request:

```bash
curl http://127.0.0.1:5000/api/dashboard
```

Sample result:

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

Status: Passed

## Conclusion

All required backend APIs were developed, connected to PostgreSQL, and tested successfully. Recipe and Inventory CRUD operations were verified by checking the PostgreSQL database after each API operation. The backend also supports auto-expiry logic and dashboard summary data.