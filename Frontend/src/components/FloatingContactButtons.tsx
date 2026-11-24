import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export const FloatingContactButtons: React.FC = () => {
  // TODO: Confirm whether these floating quick-contact numbers should be updated from placeholder +919876543210 to the official desk number +91 63020 26462
  const phoneNumber = '+919876543210';
  const whatsappNumber = '919876543210';
  const message = encodeURIComponent('Hello Inisio, I would like to discuss debt syndication and DPR advisory for my greenfield project.');

  return (
    <aside aria-label="Quick contact" className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col gap-2.5 sm:gap-3">
      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
        title="Chat on WhatsApp"
        aria-label="Chat with Greenfield Project Advisor on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-emerald-500" />
      </a>

      {/* Call Button */}
      <a
        href={`tel:${phoneNumber}`}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
        title="Call Advisory Desk"
        aria-label="Call Inisio Advisory Desk"
      >
        <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
      </a>
    </aside>
  );
};
