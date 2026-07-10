import React, { useState } from 'react';

interface LegalDocumentsModalProps {
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export const LegalDocumentsModal: React.FC<LegalDocumentsModalProps> = ({ initialTab = 'terms', onClose }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Tabs */}
        <div className="flex border-b border-white/5 bg-black/40">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'terms' 
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Terms of Use (EULA)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'privacy' 
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/5' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[11px] text-neutral-300 leading-relaxed font-medium">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">End User License Agreement (EULA)</h3>
              <p className="text-[10px] text-neutral-500">Last updated: July 2026</p>
              
              <p>
                Welcome to StyleVision AI. By installing or using our mobile application, you agree to comply with and be bound by the following Terms of Use.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">1. License Grant & Restrictions</h4>
                <p>
                  We grant you a personal, non-transferable, non-exclusive license to use StyleVision AI on compatible Apple iOS devices. You agree not to decompile, reverse-engineer, or commercially exploit any part of our AI styling technologies.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">2. User-Generated Content (UGC)</h4>
                <p>
                  Our application allows you to upload photos and apply styles via AI. You agree not to upload pictures containing offensive, unlawful, defamatory, or pornographic material. Any inappropriate usage will result in immediate termination of your account and service ban.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">3. Credit System & In-App Purchases</h4>
                <p>
                  Generations require 1 credit each. Consumable credit packs are purchased via Apple iTunes StoreKit. All sales are final. Unused credits do not expire and cannot be redeemed for cash.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">4. Limitation of Liability</h4>
                <p>
                  StyleVision AI is provided "as is" without warranties of any kind. We are not liable for any rendering dissatisfaction or data transmission loss.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">5. EULA Contact Info</h4>
                <p>
                  For support inquiries, contact support@stylevision.ai.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Privacy Policy</h3>
              <p className="text-[10px] text-neutral-500">Last updated: July 2026</p>

              <p>
                At StyleVision AI, we prioritize user privacy. This policy outlines how we handle data.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">1. Local Photo Processing</h4>
                <p>
                  Any photos you upload are processed securely. We utilize Google Gemini AI endpoints to run filters and apply face styles. Images are analyzed solely to apply the requested visual style and are not stored permanently by us or Google for training models.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">2. Personal Data & Storage</h4>
                <p>
                  We store user account profiles, credit balances, and favorited styling predictions inside secure Google Firebase Firestore instances. We do not sell, rent, or distribute your email addresses or upload data to third parties.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">3. In-App Account Deletion</h4>
                <p>
                  Consistent with App Store requirements, you can delete your account and wipe all stored profiles, favorites, and email lists instantly via the Account settings panel in the app.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wide">4. Security</h4>
                <p>
                  We implement industry-standard encryption protocols to protect your credentials and data transfers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98]"
          >
            Close & Go Back
          </button>
        </div>

      </div>
    </div>
  );
};
