import logo from '../../assets/logo.png';
import './authentication.css';

function AuthFormMain(){
    return(
        <div className='auth-form-main'>
            <div className='auth-form-intro'>
                <div className='brand-section'>
                    <img className='auth-form-logo' src={logo} alt="logo" />
                </div>
                <div className='intro-content'>
                    <h1 className='auth-form-intro-title'>
                        Stay Informed, Save Time
                    </h1>
                    <p className='auth-form-intro-description'>
                        Experience news differently with AI-powered summaries
                    </p>
                    <div className='auth-form-features'>
                        <div className='feature-item'>
                            <div className='feature-icon'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 7L13 15L9 11L3 17M21 7H15M21 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className='feature-content'>
                                <h3>Smart Aggregation</h3>
                                <p>Curated news from reputed sources</p>
                            </div>
                        </div>
                        <div className='feature-item'>
                            <div className='feature-icon'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 16H12.01M12 8V12M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className='feature-content'>
                                <h3>AI Summaries</h3>
                                <p>Get the essence in 60-100 words</p>
                            </div>
                        </div>
                        <div className='feature-item'>
                            <div className='feature-icon'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5 21H6.5C5.11929 21 4 19.8807 4 18.5V5.5C4 4.11929 5.11929 3 6.5 3H17.5C18.8807 3 20 4.11929 20 5.5V18.5C20 19.8807 18.8807 21 17.5 21Z M8 7H16 M8 11H16 M8 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className='feature-content'>
                                <h3>Personalized News</h3>
                                <p>Tailored content based on your interests</p>
                            </div>
                        </div>
                        <div className='feature-item'>
                            <div className='feature-icon'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className='feature-content'>
                                <h3>Smart Search</h3>
                                <p>Contextual search across all articles</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthFormMain;
