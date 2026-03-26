"use client";

import React from "react";
import { Send, CheckCircle, Banknote } from "lucide-react";
import Heading from "@/components/ui/Heading";
import SubHeading from "@/components/ui/SubHeading";
import Card from "@/components/ui/Card";

const steps = [
  {
    icon: Send,
    title: "Send PayPal",
    description:
      "Use your PayPal account to send the desired amount to our verified business PayPal email.",
    color: "text-violet-500",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    step: "01",
  },
  {
    icon: CheckCircle,
    title: "We Verify",
    description:
      "We confirm your payment instantly. Upload your screenshot or transaction ID for quick verification.",
    color: "text-indigo-500",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    step: "02",
  },
  {
    icon: Banknote,
    title: "You Get ZAR",
    description:
      "Get your money sent to your local South African bank account within minutes. Same-day payouts!",
    color: "text-emerald-500",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    step: "03",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Heading as="h2" className="mb-4">
            How It Works
          </Heading>
          <SubHeading className="max-w-2xl mx-auto">
            Three simple steps to convert your PayPal balance to South African Rand
          </SubHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Card key={i} hover gradient>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                  Step {step.step}
                </span>
                <div
                  className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-5`}
                >
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
