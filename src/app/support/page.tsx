"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Heading from "@/components/ui/Heading";
import SubHeading from "@/components/ui/SubHeading";

const faqs = [
  {
    q: "How long does a payout take?",
    a: "Most payouts are completed within 5–30 minutes during business hours. In some cases, it may take up to a few hours depending on your bank.",
  },
  {
    q: "What is the minimum amount I can convert?",
    a: "The minimum conversion is $5 USD. The maximum withdrawal is $100 USD per transaction.",
  },
  {
    q: "Which banks do you support?",
    a: "We support all major South African banks including FNB, Standard Bank, Absa, Nedbank, Capitec, TymeBank, Discovery Bank, and African Bank.",
  },
  {
    q: "What fees do you charge?",
    a: "We charge a 35% service fee on the USD amount. The exchange rate shown already includes this, so you always know exactly what you'll receive.",
  },
  {
    q: "What if my payment fails or gets reversed?",
    a: "If a PayPal payment cannot be verified or is reversed, we will process a refund to the original PayPal account minus any processing fees. See our Refund Policy for details.",
  },
  {
    q: "Is my information safe?",
    a: "Absolutely. We use encrypted connections and never share your personal or banking information with third parties.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Heading as="h1" gradient className="mb-4">
              How Can We Help?
            </Heading>
            <SubHeading className="max-w-2xl mx-auto">
              Our team is here to help you with any questions about your PayPal
              to ZAR conversions
            </SubHeading>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            <Card hover gradient>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  WhatsApp
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Chat with us instantly
                </p>
                <a
                  href="https://wa.me/27123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  +27 12 345 6789
                </a>
              </div>
            </Card>
            <Card hover gradient>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-violet-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Email
                </h3>
                <p className="text-sm text-gray-500 mb-3">Send us a message</p>
                <a
                  href="mailto:support@annathanpay.co.za"
                  className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  support@annathanpay.co.za
                </a>
              </div>
            </Card>
            <Card hover gradient>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Business Hours
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  When we&apos;re available
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Mon–Fri: 8am – 6pm
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Sat: 9am – 1pm
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* FAQs */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-violet-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {faq.q}
                      </span>
                      {openFaq === i ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Send className="w-5 h-5 text-violet-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Send Us a Message
                </h2>
              </div>
              <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Your Name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                  <Textarea
                    label="Message"
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                  />
                  <Button type="submit" fullWidth isLoading={sending}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
