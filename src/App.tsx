import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import PreviewPage from "./components/pages/PreviewPage";
import ArchivePage from "./components/pages/ArchivePage";
import BatchesPage from "./components/pages/BatchesPage";
import ActualProductionPage from "./components/pages/ActualProductionPage";
import BatchesListPage from "./components/pages/BatchesListPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" Component={PreviewPage} />
        <Route path="/archive" Component={ArchivePage} />
        <Route path="/batches" Component={BatchesPage} />
        <Route path="/batchesList" Component={BatchesListPage} />
        <Route path="/actual_production" Component={ActualProductionPage} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
