import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 px-4 py-2 text-xs font-black text-black shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer ${className}`}
        title="Installer Speed Rush 3D sur ton appareil"
      >
        <Download className="w-4 h-4" />
        <span>Installer le Jeu</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-black/60 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10 transition cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Installer sur iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-amber-500/40 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  Installer sur iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center">1</span>
                  <span>Touche l'icône <strong>Partager</strong> <span className="text-amber-300">⎙</span> dans la barre Safari.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center">2</span>
                  <span>Fais défiler la liste et sélectionne <strong>Sur l'écran d'accueil</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center">3</span>
                  <span>Touche <strong>Ajouter</strong> pour lancer le jeu en plein écran 3D sans barre d'adresse !</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black text-black hover:bg-amber-400 transition"
              >
                Compris !
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop / browser banner
  return (
    <button
      onClick={() => alert("Pour installer Speed Rush 3D, clique sur l'icône 'Installer' dans la barre d'adresse de ton navigateur (Chrome / Edge) ou sur mobile.")}
      className={`flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span>Appli PWA</span>
    </button>
  );
};
