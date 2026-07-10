import React, { useState } from 'react';
import { Icons } from '../constants';
import { purchasePremium, isIOS } from '../services/iapService';

interface PaywallViewProps {
  uid: string;
  onContinueFree: () => void;
  onUpgradeSuccess: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({ uid, onContinueFree, onUpgradeSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const checkoutUrl = await purchasePremium(uid);
      if (checkoutUrl) {
        // Web platform: Redirect to Stripe Checkout Session
        window.location.href = checkoutUrl;
      } else {
        // iOS platform: The StoreKit payment sheet opened natively.
        // The approved transaction listener will update Firestore and trigger state change.
        // We will keep processing state active until verification triggers success or they cancel/close.
        setTimeout(() => setIsProcessing(false), 5000);
      }
    } catch (err: any) {
      console.error("[PAYWALL] Upgrade error:", err);
      setErrorMessage(err.message || "Failed to initiate purchase session.");
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = () => {
    if (isIOS()) {
      const store = (window as any).store;
      if (store) {
        setIsProcessing(true);
        console.log("[PAYWALL] Restoring StoreKit purchases...");
        store.refresh();
        setTimeout(() => {
          setIsProcessing(false);
          alert("Purchase restore request submitted. If you have an active subscription, it will unlock automatically.");
        }, 3000);
      } else {
        alert("StoreKit payment plugin is not loaded.");
      }
    } else {
      alert("Purchase restoration is only supported on native iOS devices.");
    }
  };

  return (
    <div id="paywall-view" className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black overflow-y-auto no-scrollbar">
      
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[70%] h-[50%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[50%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500 py-8">
        
        {/* Logo and App Title */}
        <div className="flex flex-col items-center space-y-3 mt-4">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-2xl tracking-tighter text-white">SV</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-100 to-white bg-clip-text text-transparent uppercase">
              StyleVision Pro
            </h2>
            <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest">
              Unlimited Virtual Transformations
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="w-full bg-neutral-900/50 border border-white/5 backdrop-blur-md rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-extrabold text-white/90 uppercase tracking-widest text-left border-b border-white/5 pb-2 mb-1">
            Included Features:
          </h3>
          {[
            {
              title: "Unlimited AI Try-Ons",
              desc: "Get unlimited hair & beard matches without limit caps."
            },
            {
              title: "Priority Render Queues",
              desc: "Skip peak waiting hours with dedicated execution lines."
            },
            {
              title: "AI Custom Prompt Sandbox",
              desc: "Describe any look from any decade using our prompt engine."
            },
            {
              title: "Complete Library Saves",
              desc: "Store and export unlimited styling configs to your favorites."
            }
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3 text-left">
              <div className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 text-indigo-400 mt-0.5">
                <svg className="w-2.5 h-2.5 text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="flex flex-col space-y-0.5">
                <h4 className="text-[11px] font-bold text-white/90 uppercase tracking-wide">{feature.title}</h4>
                <p className="text-[10px] text-neutral-400 leading-normal">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing tag */}
        <div className="space-y-1">
          <div className="text-lg font-extrabold text-white">$9.99 <span className="text-xs font-normal text-neutral-400">/ Month</span></div>
          <p className="text-[9px] text-neutral-500 leading-normal px-6">
            Auto-renews monthly. Cancel anytime in App Store Subscriptions (iOS) or billing dashboard.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="w-full py-2.5 px-4 bg-red-500/15 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-bold tracking-wide text-center">
            {errorMessage}
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full flex flex-col space-y-3.5 pt-2">
          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/40 font-extrabold text-xs uppercase tracking-widest text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                <span>Redirecting...</span>
              </>
            ) : (
              <span>Upgrade to Premium</span>
            )}
          </button>

          <button
            onClick={onContinueFree}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 font-extrabold text-[10px] uppercase tracking-widest text-white/80 transition-all active:scale-[0.98]"
          >
            Continue with Free Trial
          </button>
        </div>

        {/* Restore Purchases / Compliance links */}
        {isIOS() && (
          <button
            onClick={handleRestorePurchases}
            disabled={isProcessing}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-400 transition-colors pt-2"
          >
            Restore Purchase History
          </button>
        )}

      </div>
    </div>
  );
};
