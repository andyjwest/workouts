import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import InGymView from './InGymView';

import ManagementView from './ManagementView';
import ReportsView from './ReportsView';
import HistoryView from './HistoryView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/workout" replace />} />
          <Route path="workout" element={<InGymView />} />
          <Route path="workout/:id" element={<InGymView />} />
          <Route path="management" element={<ManagementView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
