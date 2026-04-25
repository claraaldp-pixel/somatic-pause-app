export default function VideoPlayer({ videoUrl, videoType }) {
  if (!videoUrl) return null;

  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getVimeoId = (url) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  };

  let embedSrc = null;

  if (videoType === "youtube") {
    const id = getYouTubeId(videoUrl);
    if (id) embedSrc = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
  } else if (videoType === "vimeo") {
    const id = getVimeoId(videoUrl);
    if (id) embedSrc = `https://player.vimeo.com/video/${id}`;
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-black mb-5 shadow-sm">
      {embedSrc ? (
        <iframe
          src={embedSrc}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Exercise video"
        />
      ) : (
        <video
          src={videoUrl}
          controls
          className="w-full aspect-video"
          playsInline
        />
      )}
    </div>
  );
}
