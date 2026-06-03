import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
                JC
              </div>
              <span className="font-bold">JammCare</span>
            </div>
            <p className="text-sm text-gray-600">Healthcare services at your fingertips</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/services" className="hover:text-blue-600 transition">All Services</Link></li>
              <li><Link to="/providers" className="hover:text-blue-600 transition">Find Providers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/login" className="hover:text-blue-600 transition">Login</Link></li>
              <li><Link to="/register" className="hover:text-blue-600 transition">Register</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-blue-600 transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2026 JammCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
