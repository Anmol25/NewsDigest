import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './IntroPage.css';

const IntroPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (accessToken) {
      navigate('/home');
    }
  }, [accessToken, navigate]);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "Aggregate News from Multiple Sources",
      description: "Get the latest news from various trusted sources all in one place. Stay informed with comprehensive coverage of current events.",
      icon: "📰"
    },
    {
      title: "One-Click Summaries",
      description: "Save time with AI-powered summaries of 60-100 words. Get the key points of any article with just one click.",
      icon: "🤖"
    },
    {
      title: "Personalized Experience",
      description: "Follow your favorite topics and sources. Bookmark articles for later and get recommendations based on your interests.",
      icon: "🎯"
    }
  ];

  return (
    <div className="intro-container">
      <div className="intro-content">
        <div className="intro-header">
          <h1 className="intro-title">NewsHub</h1>
          <p className="intro-subtitle">Your AI-Powered News Companion</p>
        </div>

        <div className="intro-features">
          <div className="feature-slides">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ 
                  transform: `translateX(${(index - currentSlide) * 100}%)`,
                  opacity: index === currentSlide ? 1 : 0
                }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h2 className="feature-title">{feature.title}</h2>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="feature-dots">
            {features.map((_, index) => (
              <button 
                key={index} 
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="intro-cta">
          <Link to="/register" className="cta-button primary">Get Started</Link>
          <Link to="/login" className="cta-button secondary">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default IntroPage; 