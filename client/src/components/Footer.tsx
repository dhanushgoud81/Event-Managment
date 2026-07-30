import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 text-surface-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">EventHub</span>
            </Link>
            <p className="text-sm text-surface-400 leading-relaxed">
              Your all-in-one platform for discovering, managing, and attending amazing events.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Events', 'About', 'Contact'].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link === 'Home' ? '' : link.toLowerCase()}`}
                    className="text-sm text-surface-400 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {['Help Center', 'Privacy Policy', 'Terms of Service', 'FAQ'].map((link) => (
                <li key={link}>
                  <span className="text-sm text-surface-400 hover:text-white transition-colors cursor-pointer">
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-3">
              {[
                { icon: Mail, href: 'mailto:hello@eventhub.com' },
                { icon: Twitter, href: '#' },
                { icon: Github, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-surface-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            © {year} EventHub. All rights reserved.
          </p>
          <p className="text-xs text-surface-600">
            Built with ❤️ for event organizers
          </p>
        </div>
      </div>
    </footer>
  );
};
