import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Calendar,
  Ticket,
  QrCode,
  Shield,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export const HomePage: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* ─── Hero Section ─────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-primary-500/15 blur-[100px]"
            animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '5%', left: '5%' }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-accent-500/10 blur-[80px]"
            animate={{ x: [0, -60, 0], y: [0, 60, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '10%', right: '5%' }}
          />
          <div className="absolute inset-0 dot-pattern opacity-10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>The #1 Event Management Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight"
            >
              Discover & Manage{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 animate-gradient bg-[length:200%_200%]">
                Unforgettable
              </span>{' '}
              Events
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed"
            >
              Create, promote, and manage events effortlessly. Secure ticketing,
              instant QR confirmations, and real-time analytics — all in one beautiful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/events">
                <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Browse Events
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="xl" className="border-surface-600 text-surface-300 hover:bg-surface-800">
                  Create Account
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              {[
                { value: '10K+', label: 'Events Hosted' },
                { value: '500K+', label: 'Tickets Sold' },
                { value: '98%', label: 'Satisfaction' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-surface-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-surface-950 to-transparent" />
      </section>

      {/* ─── Features Section ─────────────── */}
      <section className="py-24 bg-white dark:bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
              Features
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">
              Everything You Need to Run{' '}
              <span className="gradient-text">Amazing Events</span>
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              From registration to QR check-in, we've got every aspect of event management covered.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: 'Event Management',
                description:
                  'Create and manage multiple events with custom branding, venues, and schedules.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Ticket,
                title: 'Smart Ticketing',
                description:
                  'Multiple ticket tiers, early bird pricing, and automatic oversell prevention.',
                color: 'from-primary-500 to-primary-600',
              },
              {
                icon: QrCode,
                title: 'QR Check-in',
                description:
                  'Instant QR code generation for registrations with seamless event-day check-in.',
                color: 'from-accent-500 to-pink-500',
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                description:
                  'Razorpay-powered payments with signature verification and fraud prevention.',
                color: 'from-green-500 to-emerald-600',
              },
              {
                icon: Users,
                title: 'Referral System',
                description:
                  'Built-in referral program with wallet rewards to boost organic growth.',
                color: 'from-orange-500 to-amber-500',
              },
              {
                icon: Zap,
                title: 'Real-time Analytics',
                description:
                  'Live dashboards with registrations, revenue, and engagement metrics.',
                color: 'from-violet-500 to-purple-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-hover p-6 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-surface-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────── */}
      <section className="py-24 bg-surface-50 dark:bg-surface-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
              How it works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white">
              Get Started in <span className="gradient-text">3 Simple Steps</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Browse Events',
                description: 'Explore our curated collection of events across various categories.',
              },
              {
                step: '02',
                title: 'Register & Pay',
                description: 'Choose your ticket, fill the form, and complete secure online payment.',
              },
              {
                step: '03',
                title: 'Get Your QR',
                description: 'Receive instant confirmation with a unique QR code for entry.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xl font-black mb-6 shadow-glow">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary-300 to-transparent" />
                )}
                <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-surface-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────── */}
      <section className="py-24 bg-white dark:bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeInUp}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 sm:p-12 text-center"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 dot-pattern opacity-10" />
            <motion.div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Create Your Next Event?
              </h2>
              <p className="text-lg text-primary-200 mb-8 max-w-xl mx-auto">
                Join thousands of organizers who trust EventHub for their event management needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button
                    size="xl"
                    className="bg-white text-primary-700 hover:bg-surface-100 hover:shadow-lg"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/events">
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Explore Events
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
