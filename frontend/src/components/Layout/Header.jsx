import { Zap } from 'lucide-react';

function Header() {
    return (
        <header className="header">
            <div className="container header-content">
                <div className="logo">
                    <div className="logo-icon">
                        <Zap size={24} color="white" />
                    </div>
                    Resume Reactor
                </div>

                <nav className="flex gap-4">
                    <a href="#" className="btn btn-ghost">How it Works</a>
                    <a href="#" className="btn btn-secondary">API Docs</a>
                </nav>
            </div>
        </header>
    );
}

export default Header;
