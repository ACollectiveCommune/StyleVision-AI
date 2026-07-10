import React, { useState } from 'react';
import { Icons } from '../constants';
import { purchasePremium, isIOS } from '../services/iapService';

interface PaywallViewProps {
  uid: string;
  onContinueFree: () => void;
  onWatchAdClick: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({ uid, onContinueFree, onWatchAdClick }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePack, setActivePack] = useState<"starter" | "pro" | "value" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = async (packType: "starter" | "pro" | "value") => {
    setIsProcessing(true);
    setActivePack(packType);
    setErrorMessage(null);
    try {
      const checkoutUrl = await purchasePremium(uid, packType);
      if (checkoutUrl) {
        // Web platform: Redirect to Stripe Checkout Session
        window.location.href = checkoutUrl;
      } else {
        // iOS platform: The StoreKit payment sheet opened natively.
        // Grant is handled automatically by the transaction listeners.
        setTimeout(() => {
          setIsProcessing(false);
          setActivePack(null);
        }, 5000);
      }
    } catch (err: any) {
      console.error("[CREDIT SHOP] Purchase failed:", err);
      setErrorMessage(err.message || "Failed to initiate purchase.");
      setIsProcessing(false);
      setActivePack(null);
    }
  };

  const handleRestorePurchases = () => {
    if (isIOS()) {
      const CdvPurchase = (window as any).CdvPurchase;
      const store = CdvPurchase?.store;
      if (store) {
        setIsProcessing(true);
        console.log("[CREDIT SHOP] Restoring StoreKit transactions...");
        store.refresh();
        setTimeout(() => {
          setIsProcessing(false);
          alert("Purchase restore request sent. If you have pending consumables, they will resolve shortly.");
        }, 3000);
      } else {
        alert("StoreKit billing is not loaded.");
      }
    } else {
      alert("Purchase restoration is only supported on native iOS devices.");
    }
  };

  return (
    <div id="paywall-view" className="absolute inset-0 z-[100] flex flex-col items-center justify-start p-6 bg-black overflow-y-auto no-scrollbar">
      
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-15%] w-[70%] h-[40%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[40%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Main Content wrapper */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500 py-6">
        
        {/* Logo and App Title */}
        <div className="flex flex-col items-center space-y-2 mt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-xl tracking-tighter text-white">SV</span>
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-purple-100 to-white bg-clip-text text-transparent uppercase">
              StyleVision Shop
            </h2>
            <p className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-widest">
              Get Generation Credits
            </p>
          </div>
        </div>

        {/* --- SECTION 1: WATCH AD OPTION (FIRST CLASS OPTION) --- */}
        <div className="w-full bg-gradient-to-tr from-indigo-950/20 to-purple-950/20 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Earn Free Credit</span>
              <span className="text-[9px] text-neutral-400 leading-normal">Watch a sponsor video to earn 1 free photo generation</span>
            </div>
          </div>
          
          <button
            onClick={onWatchAdClick}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-extrabold text-[10px] uppercase tracking-widest transition-all active:scale-[0.97]"
          >
            Watch Video (+1 Credit)
          </button>
        </div>

        {/* Pricing tag header */}
        <div className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest">
          Or Buy Credit Packages
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="w-full py-2.5 px-4 bg-red-500/15 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-bold tracking-wide text-center">
            {errorMessage}
          </div>
        )}

        {/* --- SECTION 2: CREDIT PACKS --- */}
        <div className="w-full flex flex-col space-y-3">
          {[
            {
              type: "starter" as const,
              title: "Starter Pack",
              credits: "25 Credits",
              price: "$2.99",
              tagline: "~12¢ per generation"
            },
            {
              type: "pro" as const,
              title: "Stylist Pack",
              credits: "75 Credits",
              price: "$5.99",
              tagline: "~8¢ per generation",
              popular: true
            },
            {
              type: "value" as const,
              title: "Barber Pack",
              credits: "150 Credits",
              price: "$9.99",
              tagline: "~6¢ per generation"
            }
          ].map((pack) => (
            <div
              key={pack.type}
              className={`relative w-full rounded-2xl p-4 flex justify-between items-center bg-neutral-900/50 border transition-all ${
                pack.popular 
                  ? 'border-indigo-500/50 bg-indigo-950/5 shadow-indigo-500/5 shadow-md' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Popular
                </div>
              )}
              
              <div className="flex flex-col text-left space-y-0.5">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wide">{pack.title}</span>
                <span className="text-sm font-black text-white">{pack.credits}</span>
                <span className="text-[9px] text-neutral-500 font-bold">{pack.tagline}</span>
              </div>

              <button
                onClick={() => handlePurchase(pack.type)}
                disabled={isProcessing}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all active:scale-[0.95] flex items-center justify-center gap-1.5 ${
                  pack.popular 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/5'
                }`}
              >
                {isProcessing && activePack === pack.type ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <span>{pack.price}</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Pricing disclaimer */}
        <p className="text-[9px] text-neutral-500 leading-normal px-6">
          Credits do not expire. Consumable purchases are final and added instantly to your balance.
        </p>

        {/* Actions buttons */}
        <div className="w-full flex flex-col space-y-3 pt-2">
          <button
            onClick={onContinueFree}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 font-extrabold text-[10px] uppercase tracking-widest text-white/80 transition-all active:scale-[0.98]"
          >
            Close Shop & Back
          </button>
        </div>

        {/* Restore Purchases / Compliance link */}
        {isIOS() && (
          <button
            onClick={handleRestorePurchases}
            disabled={isProcessing}
            className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-400 transition-colors pt-1"
          >
            Restore Purchase History
          </button>
        )}

      </div>
    </div>
  );
};
