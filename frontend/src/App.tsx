import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from '@/pages/Landing'
import Canvas from '@/pages/Canvas'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<Landing />} />
          <Route path="/canvas" element={<Canvas />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}