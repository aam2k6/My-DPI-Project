import { useLocation, Link } from "react-router-dom";
import "./Sidebar.css";
export default function Sidebar() {
  const location = useLocation();
  //   const navigate = useNavigate();
  return (
    <div className="sidebar">
      <ul>
        <li
          className={
            location.pathname === "/create-global-connection-type"
              ? "selected"
              : ""
          }
        >
          <Link to="/create-global-connection-type">
            Create Global Connection Type
          </Link>
        </li>
        <li
          className={location.pathname === "/manage-admins" ? "selected" : ""}
        >
          <Link to="/manage-admins">Manage Admins</Link>
        </li>
        <li
          className={
            location.pathname === "/manage-moderators" ? "selected" : ""
          }
        >
          <Link to="/manage-moderators">Manage Moderators</Link>
        </li>
        <li
          className={
            location.pathname === "/freeze-locker-connection" ? "selected" : ""
          }
        >
          <Link to="/freeze-locker-connection">Freeze Connection/Locker</Link>
        </li>
      </ul>
    </div>
  );
}
