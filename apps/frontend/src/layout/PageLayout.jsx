import NavBar from "../components/NavBar/NavBar";
import SideBar from "../components/SideBar/SideBar";
import Notification from "../components/Notification/Notification";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import "./PageLayout.css";

const FeedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setSidebarOpen(event.detail.isOpen);
    };

    document.addEventListener('sidebarToggle', handleSidebarToggle);
    
    return () => {
      document.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  return (
    <div className="page-layout">
      <NavBar />
      <div className="content-container">
        <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <SideBar />
        </div>
        <main className={`main-content ${sidebarOpen ? 'content-shifted' : ''}`}>
          <Outlet />
        </main>
      </div>
      <Notification />
    </div>
  );
};

export default FeedLayout;
