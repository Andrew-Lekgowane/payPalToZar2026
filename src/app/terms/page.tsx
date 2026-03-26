import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Heading from "@/components/ui/Heading";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Heading as="h1" className="mb-4">
            Terms of Service
          </Heading>
          <p className="text-sm text-gray-400 mb-10">
            Last updated: March 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                By accessing or using the Annathan Pay service, you agree to be bound
                by these Terms of Service. If you do not agree with any part of
                these terms, you may not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                2. Service Description
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Annathan Pay provides a currency conversion service that allows users
                to convert PayPal (USD) balances into South African Rand (ZAR)
                deposited directly into their South African bank accounts. We act
                as an intermediary facilitating these transactions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                3. User Obligations
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  You must ensure that the PayPal payment is made using your own
                  verified PayPal account.
                </li>
                <li>
                  You must provide accurate and up-to-date personal and banking
                  information.
                </li>
                <li>
                  You are responsible for any errors in the bank details you
                  provide.
                </li>
                <li>
                  You must not use the service for money laundering, fraud, or
                  any illegal activity.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                4. Payment Processing
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  Payments are processed only after successful verification of
                  the PayPal transaction.
                </li>
                <li>
                  Exchange rates are determined at the time of transaction
                  creation and are subject to change.
                </li>
                <li>
                  A service fee of 35% is applied to each transaction.
                </li>
                <li>
                  Annathan Pay reserves the right to decline any transaction that
                  appears suspicious or violates these terms.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                5. Limitations of Liability
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  We are not responsible for PayPal account limitations,
                  restrictions, or payment reversals initiated by PayPal.
                </li>
                <li>
                  We do not support funds from suspicious, restricted, or
                  unauthorized sources.
                </li>
                <li>
                  Annathan Pay is not liable for delays caused by banks or payment
                  processors.
                </li>
                <li>
                  We are not responsible for incorrect bank details provided by
                  the user.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                6. Account Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We reserve the right to suspend or terminate your account at any
                time if we believe you have violated these terms or are using our
                service for unauthorized purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                7. Changes to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update these Terms of Service from time to time. Continued
                use of the service after changes constitutes acceptance of the
                updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                8. Contact
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                If you have any questions about these Terms, please contact us at{" "}
                <a
                  href="mailto:support@annathanpay.co.za"
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                >
                  support@annathanpay.co.za
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
