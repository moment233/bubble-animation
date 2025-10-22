import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import SingleBubblePage from './pages/SingleBubblePage'
import MultiBubblesPage from './pages/MultiBubblesPage'
import RealisticBubblesPage from './pages/RealisticBubblesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<SingleBubblePage />} />
        <Route path="/multi" element={<MultiBubblesPage />} />
        <Route path="/realistic" element={<RealisticBubblesPage />} />
      </Routes>
    </BrowserRouter>
  )
}
