import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GmProvider } from './context/GmContext'
import { AppShell, RequireAuth } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { PartyPage } from './pages/PartyPage'
import { CharactersPage } from './pages/CharactersPage'
import { QuestPage } from './pages/QuestPage'
import { BattlePage } from './pages/BattlePage'
import { SummonPage } from './pages/SummonPage'
import { GmPage } from './pages/GmPage'

export default function App() {
  return (
    <AuthProvider>
      <GmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/party" element={<PartyPage />} />
                <Route path="/characters" element={<CharactersPage />} />
                <Route path="/quests" element={<QuestPage />} />
                <Route path="/battle/:questId" element={<BattlePage />} />
                <Route path="/summon" element={<SummonPage />} />
                <Route path="/gm" element={<GmPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GmProvider>
    </AuthProvider>
  )
}
