import Navbar from "../components/Navbar/Navbar";
import SourceList from "../components/SourceList/SourceList";
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
    <div className="feed-layout">
      <Navbar />
      <div className="content-container">
        <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <SourceList />
        </div>
        <main className={`main-content ${sidebarOpen ? 'content-shifted' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FeedLayout;
