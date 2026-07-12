# SmartPantry Backend

Flask REST API for SmartPantry — Milestone 2

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
export GEMINI_API_KEY=your-key-here

# Run the server
python app.py
```

## API Docs
Open http://127.0.0.1:5000/apidocs/ to see and test all endpoints.

## Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/register | Register new user |
| POST | /api/login | Login |

### Recipes
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/recipes | Get all recipes (supports filters) |
| POST | /api/recipes | Add new recipe |
| GET | /api/recipes/<id> | Get one recipe |
| PUT | /api/recipes/<id> | Update recipe |
| DELETE | /api/recipes/<id> | Delete recipe |

### Inventory
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/inventory | Get all items with freshness status |
| POST | /api/inventory | Add new ingredient |
| GET | /api/inventory/<id> | Get one item |
| PUT | /api/inventory/<id> | Update item |
| DELETE | /api/inventory/<id> | Delete item |

### Dashboard & AI
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/dashboard | Dashboard summary + recipe suggestions |
| POST | /api/ai/chat | Chat with AI assistant |

## Test with curl

```bash
# Get all recipes
curl http://localhost:5000/api/recipes

# Add a recipe
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"name":"Egg Fried Rice","tags":["Dinner","Quick"],"calories":400,"time":20,"difficulty":"Easy","rating":4.5,"ingredients":["Eggs","Rice","Soy Sauce"]}'

# Get inventory with freshness
curl http://localhost:5000/api/inventory

# Chat with AI
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What should I cook tonight?"}'

# Dashboard
curl http://localhost:5000/api/dashboard
```
