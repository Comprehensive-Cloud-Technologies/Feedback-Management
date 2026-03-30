
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const adminJwt = (typeof window !== 'undefined') ? localStorage.getItem('canteenAdminJWT') : null;
  let roleLabel: string | null = null;
  try {
    if (adminJwt) {
      const payload = JSON.parse(atob(adminJwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      if (payload?.role === 'admin') roleLabel = 'Admin';
      if (payload?.role === 'branch_admin') roleLabel = `Branch Admin${payload.site ? ` • ${payload.site}` : ''}`;
    }
  } catch {}

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-center py-4 relative">
        <div className="text-center">
          <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-10 mx-auto mb-1" />
          <h1 className="text-xl font-bold text-gray-900"> Canteen Feedback System </h1>
        </div>
        {roleLabel && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-full shadow">
            {roleLabel}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
