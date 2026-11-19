import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { StudioProvider } from './context/StudioContext';
import { AlatKreatifPage } from './pages/AlatKreatifPage';
import { BerandaPage } from './pages/BerandaPage';
import { EditorFotoPage } from './pages/EditorFotoPage';
import { HapusLatarPage } from './pages/HapusLatarPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { ProyekSesiPage } from './pages/ProyekSesiPage';
import { SemuaAlatPage } from './pages/SemuaAlatPage';
import { UtilitasCepatPage } from './pages/UtilitasCepatPage';

export function App() {
  return (
    <StudioProvider>
      <SplashScreen />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<BerandaPage />} />
            <Route path="/semua-alat" element={<SemuaAlatPage />} />
            <Route path="/editor-foto" element={<EditorFotoPage />} />
            <Route path="/hapus-latar" element={<HapusLatarPage />} />
            <Route path="/utilitas-cepat" element={<UtilitasCepatPage />} />
            <Route path="/alat-kreatif" element={<AlatKreatifPage />} />
            <Route path="/proyek-sesi" element={<ProyekSesiPage />} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StudioProvider>
  );
}

export default App;
