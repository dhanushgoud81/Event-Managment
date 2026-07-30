import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-primary-500/20 blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '10%', left: '10%' }}
          />
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-accent-500/15 blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '20%', right: '10%' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-primary-400/10 blur-3xl"
            animate={{
              x: [0, 60, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '50%', left: '40%' }}
          />
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to{' '}
              <span className="gradient-text-hero">EventHub</span>
            </h1>

            <p className="text-lg text-surface-400 leading-relaxed">
              Discover amazing events, register seamlessly, and connect with communities that
              inspire you.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              {[
                { value: '10K+', label: 'Events' },
                { value: '50K+', label: 'Users' },
                { value: '99%', label: 'Satisfaction' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-white dark:bg-surface-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl gradient-text">EventHub</span>
          </div>

          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};
