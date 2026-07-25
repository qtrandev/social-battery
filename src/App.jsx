import { Routes, Route } from 'react-router';
import Home from './pages/Home.jsx';
import CreateBattery from './pages/CreateBattery.jsx';
import ViewBattery from './pages/ViewBattery.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/new" element={<CreateBattery />} />
      <Route path="/:slug" element={<ViewBattery />} />
      <Route path="/:slug/:version" element={<ViewBattery />} />
    </Routes>
  );
}
