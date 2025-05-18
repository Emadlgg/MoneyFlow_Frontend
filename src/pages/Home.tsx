import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-6">Bienvenido</h1>
      <Link 
        to="/register" 
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
      >
        Sign up
      </Link>
        <Link 
        to="/login" 
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
      >
        Sign in
      </Link>
    </div>
  )
}