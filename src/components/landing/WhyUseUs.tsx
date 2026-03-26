"use client";

import React from "react";
import { Clock, TrendingUp, Headphones, ShieldCheck, Smartphone, CreditCard } from "lucide-react";
import Heading from "@/components/ui/Heading";
import SubHeading from "@/components/ui/SubHeading";

const features = [
  {
    icon: Clock,
    title: "Same-Day Payouts",
    description: "Get your ZAR within minutes. No waiting days for your money.",
    color: "text-violet-500",
    bg: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    icon: TrendingUp,
    title: "Best Exchange Rates",
    description: "We offer competitive rates that beat most alternatives in SA.",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    icon: Headphones,
    title: "Local Support",
    description: "Our friendly SA-based team is always ready to help via chat or WhatsApp.",
    color: "text-indigo-500",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Transparent",
    description: "Every transaction is verified and tracked. No hidden fees.",
    color: "text-sky-500",
    bg: "bg-sky-100 dark:bg-sky-900/30",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access your dashboard and convert from any device, anywhere.",
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: CreditCard,
    title: "All SA Banks",
    description: "We support FNB, Standard Bank, Absa, Capitec, Nedbank, and more.",
    color: "text-rose-500",
    bg: "bg-rose-100 dark:bg-rose-900/30",
  },
];

export default function WhyUseUs() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Heading as="h2" className="mb-4">
            Why Use Annathan Pay?
          </Heading>
          <SubHeading className="max-w-2xl mx-auto">
            We make it simple, fast, and safe to get your PayPal money in ZAR
          </SubHeading>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
