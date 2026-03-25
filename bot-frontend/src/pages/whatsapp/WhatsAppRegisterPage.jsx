import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../../lib/supabase';

export default function WhatsAppRegisterPage() {
  const { login, authenticated, user, ready } = usePrivy();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const whatsappNumber = searchParams.get('wa') || '';

  useEffect(() => {
    if (ready && authenticated && user && !showSuccess) {
      handleRegistration();
    }
  }, [authenticated, user, ready, showSuccess]);

  const handleRegistration = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Authenticate with email/link (works better in restricted browsers than social login)
      // We'll use email link sign-in which doesn't require pop-ups in many cases
      // Note: In WhatsApp's browser, we may need to fall back to just creating a Privy user
      // without immediate wallet connection due to browser restrictions
      
      // For now, we'll attempt login and handle what works in the browser
      await login();
      
      // If we get here, login succeeded (may be partial in restricted browser)
      // Create/update user profile in Supabase
      await supabase.from('profiles').upsert({
        privy_id: user.id,
        email: user.email?.address || null,
        phone: user.phone?.number || null,
        whatsapp_id: whatsappNumber,
        // NOTE: We do NOT set wallet_address here because wallet connection
        // may not work in WhatsApp's browser. We'll mark as pending.
        wallet_address: null,
        wallet_setup_pending: true, // Flag to complete wallet setup later
        updated_at: new Date().toISOString()
      });

      // Notify WhatsApp bot about registration (so it knows user exists)
      try {
        const botUrl = import.meta.env.VITE_WHATSAPP_BOT_URL || 
                      'https://peydot-whatsapp-bot.onrender.com'; // Will be set to actual URL
        await fetch(`${botUrl}/webhook/registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsapp_id: whatsappNumber,
            wallet_address: null, // Will be set up later
            email: user.email?.address,
            phone: user.phone?.number
          })
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail registration if webhook fails
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      // Even if there's an error, we might have a partial auth state
      // Check if we at least got a user object
      if (user) {
        // Try to create a minimal profile so user isn't lost
        try {
          await supabase.from('profiles').upsert({
            privy_id: user.id,
            email: user.email?.address || null,
            phone: user.phone?.number || null,
            whatsapp_id: whatsappNumber,
            wallet_address: null,
            wallet_setup_pending: true,
            updated_at: new Date().toISOString()
          });
          
          // Still notify bot
          try {
            const botUrl = import.meta.env.VITE_WHATSAPP_BOT_URL || 
                          'https://peydot-whatsapp-bot.onrender.com';
            await fetch(`${botUrl}/webhook/registration`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                whatsapp_id: whatsappNumber,
                wallet_address: null,
                email: user.email?.address,
                phone: user.phone?.number
              })
            });
          } catch (e) { /* ignore */ }
          
          setShowSuccess(true);
        } catch (e2) {
          setError('Failed to create account. Please try again.');
          setIsLoading(false);
        }
      } else {
        setError('Registration failed. Please check your connection and try again.');
        setIsLoading(false);
      }
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center">
              <span className="text-xl text-white">✅</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h1>
          <p className="text-gray-600 mb-6">
            Your Peys account is ready. Return to WhatsApp to finish setup.
          </p>
          
          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Next Steps:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go back to WhatsApp</li>
              <li>Send <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">menu</code></li>
              <li>Follow the prompts to set up your wallet</li>
              <li>Start sending and receiving payments!</li>
            </ol>
          </div>
          
          {/* Return to WhatsApp link */}
          <div className="flex items-center justify-center">
            <a 
              href="whatsapp://send?text=menu%20to%20${encodeURIComponent(whatsappNumber)}"
              className="block w-full max-w-xs text-center bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>📱 Open WhatsApp</span>
              <span className="ml-2">→</span>
            </a>
          </div>
          
          {/* Fallback for browsers that don't support whatsapp:// scheme */}
          <p className="mt-4 text-xs text-gray-500">
            If the button doesn't work, manually go to WhatsApp and send "menu" to your bot.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 border-2 border-[#6C63FF] rounded-full border-t-transparent animate-spin"></div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onLogin={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4">
            <span className="text-lg text-white">📱</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Create Your Peys Account</h1>
          <p className="text-gray-600 mb-6">
            Use your email or phone to register. Your wallet will be set up after you return to WhatsApp.
          </p>
          
          {/* WhatsApp Number Display */}
          {whatsappNumber && (
            <div className="bg-[#6C63FF]/10 rounded-lg p-4 mb-5">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-[#6C63FF]/20 flex items-center justify-center">
                  <span className="text-sm">📱</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Linked WhatsApp</p>
                  <p className="font-medium text-gray-800">+{whatsappNumber}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Simple Login Button - using Privy's built-in handling */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] hover:opacity-90 shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              <>
                <span>Continue with Email/Phone</span>
                <span className="ml-2">→</span>
              </>
            )}
          </button>
          
          {/* Notes */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Secured by Privy. Wallet setup completed after returning to WhatsApp.
          </p>
          <p className="mt-1 text-xs text-gray-400 text-center">
            By continuing, you agree to our Terms and Privacy Policy
          </p>
        </form>
      </div>
    );
  }
}
