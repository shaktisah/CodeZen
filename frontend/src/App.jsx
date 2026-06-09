import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import AdminPanel from "./pages/AdminPanel";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import Profile from "./pages/Profile";
import { AuthProvider } from "./components/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/problem/:id" element={<ProblemWorkspace />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;