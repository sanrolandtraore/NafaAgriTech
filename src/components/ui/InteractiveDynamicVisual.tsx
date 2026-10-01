import React, { useState, useRef } from "react";
import { Play, Pause, Sparkles, Info, Eye, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Hotspot {
  id: string;
  x: number; // Pourcentage horizontal (0-100)
  y: number; // Pourcentage vertical (0-100)
  label: string;
  value: string;
  badge?: string;
}

interface InteractiveDynamicVisualProps {
  imageSrc: string;
  alt: string;
  videoSrc?: string;
  title?: string;
  subtitle?: string;
  hotspots?: Hotspot[];
  aspectRatio?: "video" | "square" | "portrait" | "banner";
  badgeText?: string;
  className?: string;
  interactiveHotspots?: boolean;
}

export const InteractiveDynamicVisual: React.FC<InteractiveDynamicVisualProps> = ({
  imageSrc,
  alt,
  videoSrc,
  title,
  subtitle,
  hotspots = [],
  aspectRatio = "video",
  badgeText,
  className = "",
  interactiveHotspots = true,
}) => {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12; // Amplitude de rotation 3D
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
    setActiveHotspot(null);
  };

  const toggleVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoSrc || !videoRef.current) return;

    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlayingVideo(true);
      }).catch((err) => {
        console.warn("Lecture vidéo auto bloquée", err);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[4/5]",
    banner: "aspect-[21/9] sm:aspect-[16/7]",
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-[24px] bg-slate-950 border border-white/15 shadow-xl transition-all duration-500 cursor-pointer ${aspectClasses[aspectRatio]} ${className}`}
      style={{
        perspective: "1000px",
        transform: isHovered
          ? `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg) scale3d(1.02, 1.02, 1.02)`
          : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      }}
    >
      {/* ── PHOTO STATIQUE TRANSFORMÉE EN VISUEL DYNAMIQUE ── */}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out select-none ${
          isPlayingVideo ? "opacity-0 scale-105" : "opacity-100 group-hover:scale-110 group-hover:brightness-105"
        }`}
      />

      {/* ── VIDÉO FLUIDE EN CAS DE MODE INTERACTIF ── */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          muted={isMuted}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isPlayingVideo ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onEnded={() => setIsPlayingVideo(false)}
        />
      )}

      {/* ── EFFET SHIMMER LUMINEUX CYCLIQUE AU SURVOL ── */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

      {/* ── DÉGRADÉ POUR LISIBILITÉ DU TEXTE ET DES BADGES ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20 pointer-events-none" />

      {/* ── BADGE D'ÉTAT SUPÉRIEUR VIVANT ── */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-2">
          {badgeText && (
            <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full backdrop-blur-md shadow-md flex items-center gap-1.5 border border-emerald-400/40">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>{badgeText}</span>
            </Badge>
          )}
          <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F97316] animate-spin" />
            Visuel dynamique
          </span>
        </div>

        {/* Bouton de lecture vidéo si disponible */}
        {videoSrc && (
          <div className="flex items-center gap-1.5">
            {isPlayingVideo && (
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
                className="w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform active:scale-90"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={isPlayingVideo ? "Mettre en pause" : "Regarder l'animation"}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-black text-[11px] shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
            >
              {isPlayingVideo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
              <span>{isPlayingVideo ? "Pause" : "Voir en action"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── POINTS D'INTÉRÊT INTERACTIFS (HOTSPOTS SUR LA PHOTO) ── */}
      {interactiveHotspots &&
        hotspots.map((hs) => {
          const isSelected = activeHotspot?.id === hs.id;
          return (
            <div
              key={hs.id}
              className="absolute z-20 transition-transform duration-300 pointer-events-auto"
              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
              onMouseEnter={() => setActiveHotspot(hs)}
              onClick={(e) => {
                e.stopPropagation();
                setActiveHotspot(isSelected ? null : hs);
              }}
            >
              {/* Point lumineux pulsant */}
              <button
                type="button"
                aria-label={hs.label}
                className="relative -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/90 text-white flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-500/50 hover:scale-125 transition-transform"
              >
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <Eye className="w-3 h-3 relative z-10" />
              </button>

              {/* Info-bulle interactive */}
              {isSelected && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 min-w-[160px] bg-slate-900/95 text-white p-2.5 rounded-xl border border-emerald-500/40 shadow-2xl backdrop-blur-md z-30 animate-fade-in pointer-events-none">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mb-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{hs.label}</span>
                  </div>
                  <div className="text-xs font-black text-white">{hs.value}</div>
                  {hs.badge && (
                    <div className="mt-1 text-[9px] text-gray-300 bg-white/10 px-1.5 py-0.5 rounded inline-block">
                      {hs.badge}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* ── TITRE, SOUS-TITRE & INDICATEUR D'INTERACTION EN BAS ── */}
      <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1 text-white pointer-events-none">
        {title && (
          <h4 className="text-sm sm:text-base font-heading font-extrabold drop-shadow-md text-white group-hover:text-[#F97316] transition-colors flex items-center gap-1.5">
            <span>{title}</span>
          </h4>
        )}
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-gray-200/90 line-clamp-2 drop-shadow-sm font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default InteractiveDynamicVisual;
