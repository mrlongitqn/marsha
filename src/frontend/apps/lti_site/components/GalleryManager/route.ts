export const GALLERY_MANAGER_ROUTE = {
  default: '/galleries/videos',
  video: '/galleries/videos/:videoId',
};

export const builderGalleryVideoRoute = (videoId: string) =>
  `/galleries/videos/${videoId}`;
