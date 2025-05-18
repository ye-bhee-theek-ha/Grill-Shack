"use client";
import React, { useState } from 'react';

// Interface for FAQ item
interface FAQItem {
  question: string;
  answer: string;
}

// Interface for the FAQ Section props
interface FAQSectionProps {
  title?: string;
  faqItems: FAQItem[];
}

const FAQ: React.FC<FAQSectionProps> = ({
  title = "Frequently Asked Questions",
  faqItems
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full px-[70px] py-8 ">
      <h2 className="text-h2 mb-[32px] font-awakening text-color-text-primary">{title}</h2>
      
      <div className="space-y-[10px]">
        {faqItems.map((item, index) => (
          <div key={index} className="border-b border-grey/50"
          >
            <button
              className="w-full py-4 flex justify-between items-center text-left"
              onClick={() => toggleQuestion(index)}
            >
              <span className="text-h5 text-color-text-primary font-medium">{item.question}</span>
              <svg
                className={`w-5 h-5 text-white transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300  ${
                openIndex === index ? 'max-h-96 py-[20px] border-t border-grey/50 bg-grey/10' : 'max-h-0'
              }`}
            >
              <p className="text-grey text-normal3 pl-[10px]">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;