import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Archive from '@/pages/Archive'
import Drop from '@/pages/Drop'
import Plans from '@/pages/Plans'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/drop/:num" element={<Drop />} />
      <Route path="/drop" element={<Drop />} />
      <Route path="/plans" element={<Plans />} />
    </Routes>
  )
}
