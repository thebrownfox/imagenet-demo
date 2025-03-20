import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import Home from './pages/Home'


// Not found component
const NotFound = () => (
    <div>
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/">Back to Home</Link>
    </div>
)

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App