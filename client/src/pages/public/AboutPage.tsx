import React from 'react';
import { Card } from '@/components/ui/Card';
import { Sparkles, Heart, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12 animate-fade-in-up">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold gradient-text leading-tight">About EventHub</h1>
        <p className="text-lg text-surface-500 max-w-xl mx-auto">
          We build robust digital tools to help organizers organize, secure, and grow live community events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Heart, title: 'Built with Love', desc: 'Crafted for seamless attendee experiences.' },
          { icon: ShieldCheck, title: 'Secure Ticketing', desc: 'Encrypted databases and verify-on-entry QR codes.' },
          { icon: Users, title: 'Referral Driven', desc: 'Wallet-reward systems that naturally build viral interest.' },
        ].map((item, i) => (
          <Card key={i} className="text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto text-primary-500">
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-surface-900 dark:text-white">{item.title}</h3>
            <p className="text-sm text-surface-500">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
