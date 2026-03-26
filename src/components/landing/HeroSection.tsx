"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import SubHeading from "@/components/ui/SubHeading";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Trust badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8">
          <Shield className="w-4 h-4" />
          Trusted by 2,000+ South Africans
        </div>

        {/* Main heading */}
        <div className="animate-fade-in">
          <Heading as="h1" gradient className="max-w-4xl mx-auto mb-6">
            Withdraw Your PayPal Money in South Africa – Fast & Easy!
          </Heading>
        </div>

        {/* Sub heading */}
        <div className="animate-fade-in-delay">
          <SubHeading className="max-w-2xl mx-auto mb-10">
            Send PayPal funds and receive ZAR straight to your local bank account
            in minutes. Best rates, same-day payouts, zero hassle.
          </SubHeading>
        </div>

        {/* CTA Buttons */}
        <div className="animate-fade-in-delay-2 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register">
            <Button size="lg">
              Start Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg">
              Learn How It Works
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-delay-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
            <Zap className="w-8 h-8 text-violet-500 mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">5 min</p>
            <p className="text-sm text-gray-500">Average Payout</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
            <TrendingUp className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R18.50</p>
            <p className="text-sm text-gray-500">Current Rate / $1</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800">
            <Shield className="w-8 h-8 text-indigo-500 mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
            <p className="text-sm text-gray-500">Secure & Transparent</p>
          </div>
        </div>
      </div>
    </section>
  );
}
