"use client";

import React from "react";
import { Star } from "lucide-react";
import Heading from "@/components/ui/Heading";
import SubHeading from "@/components/ui/SubHeading";
import Card from "@/components/ui/Card";

const testimonials = [
  {
    name: "Sipho M.",
    location: "Johannesburg",
    text: "I finally withdrew my freelance income from PayPal – thank you! The process was so smooth and I got my ZAR within 10 minutes.",
    rating: 5,
  },
  {
    name: "Thandi K.",
    location: "Cape Town",
    text: "Best rates I&apos;ve found in SA. Been using Annathan Pay for 6 months now and never had an issue. Their support team is amazing!",
    rating: 5,
  },
  {
    name: "James P.",
    location: "Durban",
    text: "As a Fiverr seller, I need to convert PayPal to ZAR regularly. Annathan Pay makes it so easy. Same-day payouts every time!",
    rating: 5,
  },
  {
    name: "Naledi S.",
    location: "Pretoria",
    text: "I was skeptical at first but these guys are legit. Fast, transparent, and the exchange rate is really competitive.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Heading as="h2" className="mb-4">
            What Our Users Say
          </Heading>
          <SubHeading className="max-w-2xl mx-auto">
            Join thousands of South Africans who trust Annathan Pay for their PayPal withdrawals
          </SubHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} hover>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500">{t.location}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
