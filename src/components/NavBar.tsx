import { Link, useLocation } from "react-router-dom";
import Login from "./Login";

const NavBar = () => {
  const location = useLocation();

  return (
    <div className="nav-container">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <nav className="flex space-x-4 nav-tabs">
            <Link
              to="/"
              className={`nav-tab px-6 py-4 text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "active text-blue-500 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              Orgs List
            </Link>
            <Link
              to="/simulation"
              className={`nav-tab px-6 py-4 text-sm font-medium transition-colors ${
                location.pathname === "/simulation"
                  ? "active text-blue-500 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              }`}
            >
              Simulation
            </Link>
          </nav>
          <div className="py-4">
            <Login />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
