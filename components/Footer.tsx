
import React from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-charcoal-card border-t border-charcoal-card/50 mt-16">
      <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-subtle-text">&copy; {new Date().getFullYear()} LuxeCut. All Rights Reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="text-subtle-text hover:text-lime-accent transition-colors"><Instagram /></a>
          <a href="#" className="text-subtle-text hover:text-lime-accent transition-colors"><Facebook /></a>
          <a href="#" className="text-subtle-text hover:text-lime-accent transition-colors"><Twitter /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;