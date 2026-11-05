import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Eye,
  Smartphone,
  RotateCcw,
  AlertTriangle,
  Mic,
  Play,
  Upload,
  Check,
  Sparkles,
  Info,
  Radio,
} from 'lucide-react';
import { GameSettings } from '../types/game';
import { gameStore } from '../state/gameStore';
import { soundManager, VoiceLineInfo } from '../audio/SoundManager';

interface SettingsModalProps {
  settings: GameSettings;
  onClose: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'voices'>('general');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [voiceList, setVoiceList] = useState<VoiceLineInfo[]>(soundManager.getVoiceList());
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetVoiceIdRef = useRef<string | null>(null);

  const handleMusicVol = (val: number) => {
    gameStore.updateSettings({ musicVolume: val });
    soundManager.setMusicVolume(val);
  };

  const handleSfxVol = (val: number) => {
    gameStore.updateSettings({ sfxVolume: val });
    soundManager.setSfxVolume(val);
    soundManager.playCoin();
  };

  const handleGraphics = (quality: 'low' | 'medium' | 'high') => {
    gameStore.updateSettings({ graphicsQuality: quality });
    soundManager.playUiClick();
  };

  const handleTouchToggle = (visible: boolean) => {
    gameStore.updateSettings({ touchControlsVisible: visible });
    soundManager.playUiClick();
  };

  const handleConfirmReset = () => {
    soundManager.playCrash();
    onResetProgress();
    setShowConfirmReset(false);
    onClose();
  };

  const handleTestVoice = (id: VoiceLineInfo['id']) => {
    setPlayingVoiceId(id);
    soundManager.playVoiceLineTest(id);
    setTimeout(() => {
      setPlayingVoiceId(null);
    }, 1800);
  };

  const triggerFileUpload = (id: string) => {
    targetVoiceIdRef.current = id;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = targetVoiceIdRef.current;
    if (!file || !targetId) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      alert('Veuillez sélectionner un fichier audio valide (.mp3, .wav, .ogg, .m4a).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.setCustomVoice(targetId, dataUrl);
        setVoiceList(soundManager.getVoiceList());
        setUploadNotification(`Voix "${targetId.toUpperCase()}" mise à jour avec succès !`);
        setTimeout(() => setUploadNotification(null), 3000);
        soundManager.playVoiceLineTest(targetId as any);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetVoice = (id: string) => {
    soundManager.removeCustomVoice(id);
    setVoiceList(soundManager.getVoiceList());
    setUploadNotification(`Voix "${id.toUpperCase()}" réinitialisée.`);
    setTimeout(() => setUploadNotification(null), 2500);
    soundManager.playUiClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">
                Paramètres & Studio Audio
              </h2>
              <p className="text-xs text-zinc-400">
                Audio, voix officielles (CR7 SIUUU), graphismes et commandes
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-zinc-900/30 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('general');
            }}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'general'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Général</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUiClick();
              setActiveTab('voices');
            }}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'voices'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Studio des Voix (CR7 SIUUU)</span>
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Actif
            </span>
          </button>
        </div>

        {/* Hidden File Input for MP3 Uploads */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,.mp3,.wav,.ogg,.m4a"
          className="hidden"
        />

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {uploadNotification && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadNotification}</span>
            </div>
          )}

          {activeTab === 'general' && (
            <>
              {/* AUDIO CONTROLS */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Contrôles Audio</span>
                </h3>

                {/* Music Slider */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-black text-white">
                    <span>Volume Musique</span>
                    <span className="font-mono text-amber-400">
                      {Math.round(settings.musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.musicVolume}
                    onChange={(e) => handleMusicVol(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* SFX Slider */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-black text-white">
                    <span>Volume Bruitages & Voix</span>
                    <span className="font-mono text-cyan-400">
                      {Math.round(settings.sfxVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxVolume}
                    onChange={(e) => handleSfxVol(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* GRAPHICS QUALITY */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Qualité Graphique</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleGraphics(q)}
                      className={`py-3 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                        settings.graphicsQuality === q
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {q === 'low' ? 'Basse' : q === 'medium' ? 'Moyenne' : 'Ultra 60FPS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* TOUCH CONTROLS */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Commandes Tactiles Mobiles</span>
                </h3>

                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-white">Boutons tactiles à l'écran</div>
                    <div className="text-xs text-zinc-400">
                      Affiche les touches Saut, Glissade et D-pad sur écran tactile
                    </div>
                  </div>

                  <button
                    onClick={() => handleTouchToggle(!settings.touchControlsVisible)}
                    className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                      settings.touchControlsVisible
                        ? 'bg-emerald-500 justify-end'
                        : 'bg-zinc-800 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* DANGER ZONE / RESET */}
              <div className="pt-4 border-t border-white/10">
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Réinitialiser la progression</span>
                  </button>
                ) : (
                  <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Êtes-vous sûr ? Cette action est irréversible !</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Toutes les pièces, skins débloqués et records seront réinitialisés.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmReset}
                        className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase cursor-pointer"
                      >
                        Oui, tout effacer
                      </button>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'voices' && (
            <div className="flex flex-col gap-5">
              {/* Voice Studio Hero Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-purple-500/20 border border-white/15 rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Radio className="w-5 h-5" />
                    </span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Gestionnaire des Voix & Annonces
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" /> SIUUU CR7 INTÉGRÉ
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  L'audio officiel de <strong>Cristiano Ronaldo (SIUUU!)</strong> que tu as envoyé est
                  maintenant directement relié au moteur de jeu. Tu peux tester chaque voix
                  ci-dessous ou importer tes propres fichiers MP3 trouvés sur internet !
                </p>
              </div>

              {/* List of Voices */}
              <div className="flex flex-col gap-3">
                {voiceList.map((item) => {
                  const isPlaying = playingVoiceId === item.id;
                  const isOfficialSiuu = item.id === 'siuuu' && item.sourceType === 'official';
                  const isCustom = item.sourceType === 'custom';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isOfficialSiuu
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : isCustom
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-zinc-900/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{item.name}</span>
                          {isOfficialSiuu && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-black shadow-sm">
                              CR7 OFFICIEL
                            </span>
                          )}
                          {isCustom && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-black shadow-sm">
                              MP3 PERSO
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400">{item.trigger}</span>
                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 text-zinc-400" />
                          Source: {item.sourceLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Play Test Button */}
                        <button
                          onClick={() => handleTestVoice(item.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                            isPlaying
                              ? 'bg-amber-400 text-black scale-105'
                              : isOfficialSiuu
                              ? 'bg-amber-500 hover:bg-amber-400 text-black'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-black' : ''}`} />
                          <span>{isPlaying ? 'Écoute...' : 'Tester'}</span>
                        </button>

                        {/* Upload / Replace MP3 Button */}
                        <button
                          onClick={() => triggerFileUpload(item.id)}
                          className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Importer un fichier audio MP3 depuis votre appareil"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isCustom ? 'Changer MP3' : 'Importer MP3'}</span>
                        </button>

                        {/* Reset button if custom */}
                        {isCustom && (
                          <button
                            onClick={() => handleResetVoice(item.id)}
                            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition cursor-pointer"
                            title="Réinitialiser vers le son par défaut"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions Callout */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-start gap-3 text-xs text-zinc-400">
                <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-zinc-200">Comment ajouter de nouvelles voix ?</span>
                  <span>
                    Lorsque tu trouves un son sur internet (YouTube, Soundboard, etc.), télécharge-le
                    au format <strong>MP3</strong> ou <strong>WAV</strong>, puis clique sur le bouton{' '}
                    <strong>"Importer MP3"</strong> en face de la voix voulue. Le son sera sauvegardé
                    dans ton navigateur et retentira automatiquement en jeu !
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
