import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Shield } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 text-white py-3 px-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo - unchanged */}
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          <span className="bg-white text-indigo-600 rounded-md px-2 py-1 text-sm font-black">Ticket AI</span>
        </Link>

        {/* Slider-style Navigation Buttons */}
        <div className="flex items-center bg-indigo-500/30 p-1 rounded-lg">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
              !isAdmin
                ? 'bg-white text-indigo-700 font-medium'
                : 'hover:bg-indigo-500/50 text-white'
            }`}
          >
            <User size={16} />
            <span>Customer</span>
          </Link>

          <Link
            to="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${
              isAdmin
                ? 'bg-white text-indigo-700 font-medium'
                : 'hover:bg-indigo-500/50 text-white'
            }`}
          >
            <Shield size={16} />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;