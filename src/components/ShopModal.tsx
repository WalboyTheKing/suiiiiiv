import React, { useState } from 'react';
import { X, Check, ShoppingCart, Sparkles, Coins, Flame, Shield, ArrowRight } from 'lucide-react';
import { PlayerProfile, CharacterSkin, SneakerItem, TrailItem, AccessoryItem } from '../types/game';
import { DEFAULT_SKINS, DEFAULT_SNEAKERS, DEFAULT_TRAILS, DEFAULT_ACCESSORIES, gameStore } from '../state/gameStore';
import { soundManager } from '../audio/SoundManager';

interface ShopModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onApplyCosmetics: () => void;
}

type TabType = 'characters' | 'sneakers' | 'trails' | 'accessories';

export const ShopModal: React.FC<ShopModalProps> = ({ profile, onClose, onApplyCosmetics }) => {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(profile.selectedSkinId);

  const handleSelectSkin = (skin: CharacterSkin) => {
    soundManager.playUiClick();
    if (profile.unlockedSkins.includes(skin.id)) {
      gameStore.selectSkin(skin.id);
      onApplyCosmetics();
    } else {
      // Try buy
      if (profile.coins >= skin.price) {
        gameStore.buySkin(skin.id);
        soundManager.playPowerUp();
        onApplyCosmetics();
      }
    }
  };

  const handleSelectSneaker = (item: SneakerItem) => {
    soundManager.playUiClick();
    if (profile.unlockedSneakers.includes(item.id)) {
      gameStore.selectSneaker(item.id);
      onApplyCosmetics();
    } else {
      if (profile.coins >= item.price) {
        gameStore.buySneaker(item.id);
        soundManager.playPowerUp();
        onApplyCosmetics();
      }
    }
  };

  const handleSelectTrail = (item: TrailItem) => {
    soundManager.playUiClick();
    if (profile.unlockedTrails.includes(item.id)) {
      gameStore.selectTrail(item.id);
      onApplyCosmetics();
    } else {
      if (profile.coins >= item.price) {
        gameStore.buyTrail(item.id);
        soundManager.playPowerUp();
        onApplyCosmetics();
      }
    }
  };

  const handleSelectAccessory = (item: AccessoryItem) => {
    soundManager.playUiClick();
    if (profile.unlockedAccessories.includes(item.id)) {
      gameStore.selectAccessory(item.id);
      onApplyCosmetics();
    } else {
      if (profile.coins >= item.price) {
        gameStore.buyAccessory(item.id);
        soundManager.playPowerUp();
        onApplyCosmetics();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">Shop & Locker</h2>
              <p className="text-xs text-zinc-400">Unlock official skins, cleats, trails and street accessories</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins Display */}
            <div className="flex items-center gap-2 bg-black/60 border border-amber-500/30 rounded-2xl px-4 py-2">
              <Coins className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-base font-black text-yellow-400 font-mono">
                {profile.coins.toLocaleString()}
              </span>
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
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/10 bg-zinc-900/30 px-5 gap-2 overflow-x-auto">
          {[
            { id: 'characters', label: 'Outfits & Kits' },
            { id: 'sneakers', label: 'Cleats & Kicks' },
            { id: 'trails', label: 'Speed Trails' },
            { id: 'accessories', label: 'Accessories' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                soundManager.playUiClick();
              }}
              className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 bg-white/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* TAB 1: CHARACTERS */}
          {activeTab === 'characters' &&
            DEFAULT_SKINS.map((skin) => {
              const isOwned = profile.unlockedSkins.includes(skin.id);
              const isEquipped = profile.selectedSkinId === skin.id;
              const canAfford = profile.coins >= skin.price;

              return (
                <div
                  key={skin.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition relative overflow-hidden ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-500/10'
                      : isOwned
                      ? 'border-white/15 bg-zinc-900/60'
                      : 'border-white/5 bg-zinc-900/30'
                  }`}
                >
                  <div>
                    {/* Visual Badge / Preview */}
                    <div
                      className="w-full h-28 rounded-xl flex flex-col items-center justify-center relative overflow-hidden mb-3 border border-white/10"
                      style={{
                        background: `linear-gradient(135deg, ${skin.primaryColor} 0%, #111115 100%)`,
                      }}
                    >
                      <div className="text-4xl font-black text-white font-mono drop-shadow">
                        #{skin.jerseyNumber}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: skin.secondaryColor }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: skin.skinTone }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-white text-sm tracking-wide">{skin.name}</h4>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                        {skin.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{skin.description}</p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    {isEquipped ? (
                      <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> EQUIPPED
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleSelectSkin(skin)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectSkin(skin)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{skin.price.toLocaleString()} COINS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 2: SNEAKERS */}
          {activeTab === 'sneakers' &&
            DEFAULT_SNEAKERS.map((item) => {
              const isOwned = profile.unlockedSneakers.includes(item.id);
              const isEquipped = profile.selectedSneakerId === item.id;
              const canAfford = profile.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-500/10'
                      : isOwned
                      ? 'border-white/15 bg-zinc-900/60'
                      : 'border-white/5 bg-zinc-900/30'
                  }`}
                >
                  <div>
                    <div
                      className="w-full h-24 rounded-xl flex items-center justify-center relative mb-3 border border-white/10"
                      style={{
                        background: `radial-gradient(circle, ${item.glowColor}33 0%, #111115 80%)`,
                      }}
                    >
                      <div
                        className="w-16 h-8 rounded-lg shadow-lg border border-white/20 flex items-center justify-center font-black text-xs text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        👟
                      </div>
                    </div>

                    <h4 className="font-black text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    {isEquipped ? (
                      <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> EQUIPPED
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleSelectSneaker(item)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectSneaker(item)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{item.price.toLocaleString()} COINS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 3: TRAILS */}
          {activeTab === 'trails' &&
            DEFAULT_TRAILS.map((item) => {
              const isOwned = profile.unlockedTrails.includes(item.id);
              const isEquipped = profile.selectedTrailId === item.id;
              const canAfford = profile.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-500/10'
                      : isOwned
                      ? 'border-white/15 bg-zinc-900/60'
                      : 'border-white/5 bg-zinc-900/30'
                  }`}
                >
                  <div>
                    <div
                      className="w-full h-24 rounded-xl flex items-center justify-center relative mb-3 border border-white/10"
                      style={{
                        background: `radial-gradient(circle, ${item.particleColor}44 0%, #111115 80%)`,
                      }}
                    >
                      <Sparkles className="w-10 h-10" style={{ color: item.particleColor }} />
                    </div>

                    <h4 className="font-black text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    {isEquipped ? (
                      <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> EQUIPPED
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleSelectTrail(item)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectTrail(item)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{item.price.toLocaleString()} COINS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 4: ACCESSORIES */}
          {activeTab === 'accessories' &&
            DEFAULT_ACCESSORIES.map((item) => {
              const isOwned = profile.unlockedAccessories.includes(item.id);
              const isEquipped = profile.selectedAccessoryId === item.id;
              const canAfford = profile.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border transition ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-500/10'
                      : isOwned
                      ? 'border-white/15 bg-zinc-900/60'
                      : 'border-white/5 bg-zinc-900/30'
                  }`}
                >
                  <div>
                    <div className="w-full h-24 rounded-xl flex items-center justify-center relative mb-3 border border-white/10 bg-zinc-900">
                      <span className="text-3xl">
                        {item.type === 'headset'
                          ? '🎧'
                          : item.type === 'chain'
                          ? '⛓️'
                          : item.type === 'shades'
                          ? '🕶️'
                          : item.type === 'crown'
                          ? '👑'
                          : '🚫'}
                      </span>
                    </div>

                    <h4 className="font-black text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    {isEquipped ? (
                      <div className="text-xs font-black text-amber-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> EQUIPPED
                      </div>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleSelectAccessory(item)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectAccessory(item)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 fill-current" />
                        <span>{item.price.toLocaleString()} COINS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
