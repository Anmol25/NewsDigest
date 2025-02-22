import { useAuth } from '../contexts/AuthContext';

function Logout() {
    const { logout } = useAuth();
    return (
        <button onClick={logout}>Logout</button>
    );
}
export default Logout;