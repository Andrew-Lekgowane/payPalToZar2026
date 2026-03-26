import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Heading from "@/components/ui/Heading";

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Heading as="h1" className="mb-4">
            Refund Policy
          </Heading>
          <p className="text-sm text-gray-400 mb-10">
            Last updated: March 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                1. Refund Eligibility
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                PayZar is committed to providing a fair and transparent service.
                Refunds may be issued under the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400 mt-3">
                <li>
                  The PayPal payment cannot be verified or confirmed on our end.
                </li>
                <li>
                  A system error prevents the transaction from being processed.
                </li>
                <li>
                  The transaction is flagged as suspicious and cannot be cleared.
                </li>
                <li>
                  The service is unavailable and cannot fulfil the transaction.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                2. Refund Process
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  If the payment cannot be verified or completed, a full refund
                  will be processed to the original PayPal account, minus any
                  applicable PayPal processing fees.
                </li>
                <li>
                  To request a refund, contact our support team at{" "}
                  <a
                    href="mailto:support@payzar.co.za"
                    className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                  >
                    support@payzar.co.za
                  </a>{" "}
                  or via WhatsApp.
                </li>
                <li>
                  Include your transaction ID and the reason for the refund
                  request.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                3. Refund Timeline
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
                <li>
                  Refunds will be processed within <strong>1–2 business days</strong> after
                  the refund is approved.
                </li>
                <li>
                  The refund may take up to <strong>5 business days</strong> to appear in
                  your PayPal account, depending on PayPal&apos;s processing times.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                4. Non-Refundable Situations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Refunds will <strong>not</strong> be issued in the following cases:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400 mt-3">
                <li>
                  The ZAR payout has already been successfully deposited into
                  your bank account.
                </li>
                <li>
                  Incorrect bank details were provided by the user, causing the
                  funds to be sent to the wrong account.
                </li>
                <li>
                  The PayPal payment was sent from an unverified or restricted
                  account.
                </li>
                <li>
                  The transaction is suspected to be related to fraudulent or
                  illegal activity.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                5. Disputes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                If you believe a refund should have been issued but was not,
                please contact our support team. We will review your case and
                respond within 48 hours. We aim to resolve all disputes fairly
                and promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                6. Contact
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                For any refund-related queries, please reach out to us at{" "}
                <a
                  href="mailto:support@payzar.co.za"
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                >
                  support@payzar.co.za
                </a>{" "}
                or via WhatsApp at{" "}
                <a
                  href="https://wa.me/27123456789"
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
                >
                  +27 12 345 6789
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
