import React from "react";
import Link from "next/link";
import { Zap, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PayZar</span>
            </div>
            <p className="text-sm leading-relaxed">
              Withdraw your PayPal money in South Africa fast and easy. Get ZAR
              straight to your bank account.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#how-it-works" className="text-sm hover:text-violet-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-violet-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm hover:text-violet-400 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm hover:text-violet-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm hover:text-violet-400 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-violet-400" />
                support@payzar.co.za
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-violet-400" />
                +27 12 345 6789
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} PayZar. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            PayZar is not affiliated with PayPal, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
