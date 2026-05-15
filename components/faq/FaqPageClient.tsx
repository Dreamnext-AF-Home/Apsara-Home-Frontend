'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/landing-page/Footer';

const faqData = [
  {
    question: 'How can I place an order?',
    answer: 'To place an order, simply browse through our website, select the desired furniture item, choose any customization options if available, and add it to your shopping cart. Proceed to the checkout page, provide your shipping and payment details, and confirm the order. You will receive an order confirmation via email.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods, including major credit cards (Visa, Mastercard, American Express), debit cards, PayPal, and bank transfers. Choose the payment option that suits you best during the checkout process.',
  },
  {
    question: 'Can I customize my furniture order?',
    answer: 'Yes, we offer customization options for specific furniture items. You can often choose from different colors, materials, sizes, or configurations to meet your specific requirements. The available customization options will be indicated on the product page.',
  },
  {
    question: 'How long does it take to manufacture and deliver furniture orders?',
    answer: 'The manufacturing and delivery time can vary depending on the product and customization options. Typically, it takes around 1-2 days for laminated furniture and metal furniture and 3-5 days for sofa and upholstered furniture. However, please note that these timeframes may vary based on factors such as product availability and your location.',
  },
  {
    question: 'Do you provide international shipping?',
    answer: 'Currently, we are not shipping products outside the Philippines.',
  },
  {
    question: 'What is your return and refund policy?',
    answer: `Returns: Our policy lasts 1 week. If 1 week has gone by since your purchase, unfortunately we can't offer you a refund or exchange. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging. Additional non-returnable items: Gift cards. To complete your return, we require a receipt or proof of purchase. Please do not send your purchase back to the manufacturer.

There are certain situations where only partial refunds are granted (if applicable): Any item not in its original condition, is damaged or missing parts for reasons not due to our error. Any item that is returned more than 30 days after delivery.

Refunds (if applicable): Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.

Late or missing refunds (if applicable): If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted. If you've done all of this and you still have not received your refund yet, please contact us at afhome.team@gmail.com

Sale items (if applicable): Only regular priced items may be refunded, unfortunately sale items cannot be refunded.

Exchanges (if applicable): We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at afhome.team@gmail.com

Gifts: If the item was marked as a gift when purchased and shipped directly to you, you'll receive a gift credit for the value of your return. Once the returned item is received, a gift certificate will be mailed to you. If the item wasn't marked as a gift when purchased, or the gift giver had the order shipped to themselves to give to you later, we will send a refund to the gift giver and he will find out about your return.

You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund. Depending on where you live, the time it may take for your exchanged product to reach you, may vary.`,
  },
  {
    question: 'How can I track my order?',
    answer: 'You can track your order by visiting our Track Order page at /track-order. Enter your order details to see the current status of your shipment.',
  },
  {
    question: 'Do you offer assembly services?',
    answer: 'While some furniture items may require minimal assembly, we do provide professional assembly services. However, we include detailed assembly instructions with each item to make the process as easy as possible for you. AF Home Assembly Service Pricelist',
  },
  {
    question: 'Can I cancel or modify my order after it has been placed?',
    answer: 'If you wish to cancel or modify your order, please contact our customer service as soon as possible. We will do our best to accommodate your request if the order has not entered the manufacturing or shipping process. However, please note that once the manufacturing has started, cancellations or modifications may not be possible.',
  },
  {
    question: 'What should I do if my furniture arrives damaged or defective?',
    answer: 'If you receive damaged or defective furniture, please notify our customer service immediately. Provide them with relevant details and, if possible, attach photos of the damage. We will work with you to resolve the issue promptly, either by arranging for a replacement or initiating a refund.',
  },
];

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function FaqPageClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <TopBar />
      <Navbar />
  <main className="min-h-screen bg-blue-50 dark:bg-gradient-to-b dark:from-blue-900 dark:via-blue-900 dark:to-blue-800">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-4 pt-8 pb-8"
        >
          <div className="rounded-2xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 px-6 py-8 md:px-10 md:py-10">
            <h1 className="text-3xl font-bold text-blue-900 dark:text-white">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Find answers to common questions about AF Home
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-4 pb-16"
        >
          <div className="mx-auto max-w-3xl space-y-3">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                className="rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-blue-900 dark:text-white">
                    {faq.question}
                  </span>
                    <span className="ml-3 flex-shrink-0 text-blue-500 dark:text-blue-400">
                    <ChevronIcon isOpen={openIndex === index} />
                  </span>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-200 dark:border-gray-700 px-5 pb-4 pt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
