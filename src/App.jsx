import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RecipeLibrary from './pages/RecipeLibrary';
import Inventory from './pages/Inventory';

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<RecipeLibrary />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;