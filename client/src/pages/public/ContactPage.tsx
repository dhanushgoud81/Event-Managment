import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const ContactPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your message has been sent successfully. We will get back to you shortly!');
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in-up">
      {/* Col 1 - Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white">Get in Touch</h1>
          <p className="text-surface-500 mt-2">Have a question or feedback? We'd love to hear from you.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">support@eventhub.com</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">Silicon Valley, CA, USA</span>
          </div>
        </div>
      </div>

      {/* Col 2 - Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" placeholder="Your name" required />
          <Input label="Email" type="email" placeholder="you@example.com" required />
          <div className="space-y-1.5">
            <label className="label">Message</label>
            <textarea
              className="input min-h-[100px] py-2"
              placeholder="How can we help you?"
              required
            />
          </div>
          <Button type="submit" fullWidth>
            Send Message
          </Button>
        </form>
      </Card>
    </div>
  );
};
