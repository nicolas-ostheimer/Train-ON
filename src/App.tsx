import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/Confirm'
import { IconHome, IconCalendar, IconDumbbell } from './components/icons'
import Dashboard from './pages/Dashboard'
import WeekPlan from './pages/WeekPlan'
import Training from './pages/Training'
import ExerciseEditor from './pages/ExerciseEditor'
import TemplateEditor from './pages/TemplateEditor'
import ScheduledDetail from './pages/ScheduledDetail'
import Settings from './pages/Settings'

function BottomNav() {
  const item =
    'flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs font-medium transition-colors'
  const active = 'text-accent'
  const inactive = 'text-text-muted'
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex">
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>
          <IconHome width={24} height={24} />
          Dashboard
        </NavLink>
        <NavLink to="/woche" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>
          <IconCalendar width={24} height={24} />
          Wochenplan
        </NavLink>
        <NavLink to="/training" className={({ isActive }) => `${item} ${isActive ? active : inactive}`}>
          <IconDumbbell width={24} height={24} />
          Training
        </NavLink>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen max-w-lg mx-auto" style={{ paddingTop: 'var(--safe-top)' }}>
          <main className="pb-28 px-4 pt-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/woche" element={<WeekPlan />} />
              <Route path="/training" element={<Training />} />
              <Route path="/uebung/neu" element={<ExerciseEditor />} />
              <Route path="/uebung/:id" element={<ExerciseEditor />} />
              <Route path="/vorlage/neu" element={<TemplateEditor />} />
              <Route path="/vorlage/:id" element={<TemplateEditor />} />
              <Route path="/geplant/:id" element={<ScheduledDetail />} />
              <Route path="/einstellungen" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
