"use client";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  return (
    <div
      className="aspect-video w-full rounded-xl overflow-hidden border border-white/15 bg-black shadow-2xl relative select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        src={src}
        poster={poster}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        preload="metadata"
        className="w-full h-full object-contain bg-black select-none"
      />
    </div>
  );
}
