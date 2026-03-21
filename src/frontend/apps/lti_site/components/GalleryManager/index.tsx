import { Button } from '@openfun/cunningham-react';
import {
  Box,
  BoxError,
  BoxLoader,
  CurrentResourceContextProvider,
  ErrorComponents,
  Grid,
  Heading,
  Text,
  Video,
  builderFullScreenErrorRoute,
  uploadState,
  useAppConfig,
  useCurrentResourceContext,
  useVideo as useVideoStore,
} from 'lib-components';
import {
  DashboardVideoWrapper,
  VideosOrderType,
  useVideo,
  useDeleteVideos,
  useVideos,
} from 'lib-video';
import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { CreateVOD } from '@lib-video/components/common/VideoWizard/CreateVOD';
import { useCreateVideo } from '@lib-video/api/useCreateVideo';

import { UploadableObjectStatusBadge } from 'components/UploadableObjectStatusBadge';
import { builderGalleryVideoRoute, GALLERY_MANAGER_ROUTE } from './route';

const messages = defineMessages({
  title: {
    defaultMessage: 'Course video gallery',
    description: 'Title for the LTI gallery manager page.',
    id: 'components.GalleryManager.title',
  },
  subtitle: {
    defaultMessage:
      'Manage the videos attached to this LMS course from one refined workspace: create, upload, update and delete them with a clearer status overview.',
    description: 'Subtitle for the LTI gallery manager page.',
    id: 'components.GalleryManager.subtitle',
  },
  empty: {
    defaultMessage: 'There is no public video in this course yet.',
    description: 'Message shown when there is no video in the current playlist.',
    id: 'components.GalleryManager.empty',
  },
  addButton: {
    defaultMessage: 'Add a video',
    description: 'Button label to create a new video from the gallery list.',
    id: 'components.GalleryManager.addButton',
  },
  editButton: {
    defaultMessage: 'Edit',
    description: 'Button label to edit a video.',
    id: 'components.GalleryManager.editButton',
  },
  deleteButton: {
    defaultMessage: 'Delete',
    description: 'Button label to delete a video.',
    id: 'components.GalleryManager.deleteButton',
  },
  createSuccess: {
    defaultMessage: 'Video created.',
    description: 'Toast shown after creating a video.',
    id: 'components.GalleryManager.createSuccess',
  },
  deleteSuccess: {
    defaultMessage: 'Video deleted.',
    description: 'Toast shown after deleting a video.',
    id: 'components.GalleryManager.deleteSuccess',
  },
  deleteConfirmation: {
    defaultMessage: 'Delete this video?',
    description: 'Confirmation prompt before deleting a video from the gallery.',
    id: 'components.GalleryManager.deleteConfirmation',
  },
  newVideoTitle: {
    defaultMessage: 'New video',
    description: 'Default title used when a gallery user creates a new video.',
    id: 'components.GalleryManager.newVideoTitle',
  },
  backToGallery: {
    defaultMessage: 'Back to gallery',
    description: 'Button label to return to the gallery list.',
    id: 'components.GalleryManager.backToGallery',
  },
  genericError: {
    defaultMessage: 'Sorry, an error occurred. Please try again.',
    description: 'Fallback error message for gallery actions.',
    id: 'components.GalleryManager.genericError',
  },
  publicBadge: {
    defaultMessage: 'Public',
    description: 'Badge displayed for public videos in the gallery.',
    id: 'components.GalleryManager.publicBadge',
  },
  privateBadge: {
    defaultMessage: 'Private',
    description: 'Badge displayed for private videos in the gallery.',
    id: 'components.GalleryManager.privateBadge',
  },
  statusLabel: {
    defaultMessage: 'Status',
    description: 'Label displayed above the upload status badge.',
    id: 'components.GalleryManager.statusLabel',
  },
  visibilityLabel: {
    defaultMessage: 'Visibility',
    description: 'Label displayed above the visibility badge.',
    id: 'components.GalleryManager.visibilityLabel',
  },
  videosCount: {
    defaultMessage:
      '{count, plural, =0 {No videos yet} one {# video in this course} other {# videos in this course}}',
    description: 'Helper text showing the number of videos in the gallery.',
    id: 'components.GalleryManager.videosCount',
  },
});

const GalleryVideoCard = ({
  video,
  onEdit,
  onDelete,
}: {
  video: Video;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const intl = useIntl();
  const thumbnail = video.thumbnail?.urls?.[240] || video.urls?.thumbnails?.[240];

  return (
    <Box
      pad="medium"
      gap="medium"
      background="white"
      round="18px"
      style={{
        border: '1px solid #d7e3f4',
        boxShadow: '0 18px 36px rgba(18, 56, 97, 0.12)',
      }}
    >
      <Box
        height="160px"
        round="14px"
        pad="small"
        justify="between"
        background={
          thumbnail
            ? `url(${thumbnail}) center / cover`
            : 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)'
        }
      >
        <Box direction="row" justify="between" align="start">
          <Text
            size="tiny"
            weight="bold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.92)',
              color: '#17324d',
              borderRadius: '999px',
              padding: '6px 12px',
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>
              movie
            </span>
            {video.is_live ? 'Live' : 'VOD'}
          </Text>
        </Box>

        <Box align="center" justify="center">
          <span
            className="material-icons"
            style={{
              fontSize: '54px',
              color: 'rgba(255,255,255,0.95)',
              textShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}
          >
            play_circle
          </span>
        </Box>
      </Box>

      <Box direction="row" justify="between" align="start" gap="small">
        <Box gap="xsmall" style={{ flex: 1 }}>
          <Text
            weight="bold"
            size="large"
            style={{ color: '#10243e', lineHeight: 1.3 }}
          >
            {video.title || '-'}
          </Text>
          {video.description && (
            <Text size="small" color="dark-5" truncate={3}>
              {video.description}
            </Text>
          )}
        </Box>
        <Box gap="xsmall" align="end">
          <Box direction="row" align="center" gap="small" wrap="wrap">
            <Box gap="xxsmall" align="end">
              <Text size="tiny" weight="bold" color="dark-4">
                {intl.formatMessage(messages.visibilityLabel)}
              </Text>
              <Box
                direction="row"
                align="center"
                gap="xxsmall"
                style={{
                  background: video.is_public ? '#e7f6ec' : '#f2f4f7',
                  color: video.is_public ? '#0f8f4f' : '#5f6b7a',
                  borderRadius: '999px',
                  padding: '6px 12px',
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  {video.is_public ? 'public' : 'lock'}
                </span>
                <Text size="tiny" weight="bold">
                  {intl.formatMessage(
                    video.is_public ? messages.publicBadge : messages.privateBadge,
                  )}
                </Text>
              </Box>
            </Box>
            <Box gap="xxsmall" align="end">
              <Text size="tiny" weight="bold" color="dark-4">
                {intl.formatMessage(messages.statusLabel)}
              </Text>
              <UploadableObjectStatusBadge object={video} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        gap="small"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%' }}
      >
        <Button
          fullWidth
          icon={<span className="material-icons">edit</span>}
          onClick={onEdit}
        >
          {intl.formatMessage(messages.editButton)}
        </Button>
        <Button
          color="secondary"
          fullWidth
          icon={<span className="material-icons">delete</span>}
          onClick={onDelete}
        >
          {intl.formatMessage(messages.deleteButton)}
        </Button>
      </Box>
    </Box>
  );
};

export const GalleryManager = () => {
  const intl = useIntl();
  const appData = useAppConfig();
  const navigate = useNavigate();
  const playlistId = appData.playlist?.id || '';

  const apiResponse = useVideos(
    {
      playlist: playlistId,
      limit: '999',
      is_live: 'false',
      ordering: VideosOrderType.BY_CREATED_ON_REVERSED,
    },
    {
      enabled: !!playlistId,
      refetchInterval: 5000,
    },
  );

  const createVideoMutation = useCreateVideo({
    onSuccess: (video) => {
      toast.success(intl.formatMessage(messages.createSuccess), {
        position: 'bottom-center',
      });
      navigate(builderGalleryVideoRoute(video.id));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.genericError), {
        position: 'bottom-center',
      });
    },
  });

  const deleteVideoMutation = useDeleteVideos({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.deleteSuccess), {
        position: 'bottom-center',
      });
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.genericError), {
        position: 'bottom-center',
      });
    },
  });

  const currentVideos = useMemo(
    () =>
      apiResponse.data?.results ||
      appData.videos?.filter((video) => video.playlist.id === playlistId) ||
      [],
    [apiResponse.data?.results, appData.videos, playlistId],
  );

  if (!playlistId) {
    return <BoxError message={intl.formatMessage(messages.genericError)} />;
  }

  return (
    <Box
      pad="large"
      gap="medium"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(214,236,255,0.85), rgba(255,255,255,1) 45%)',
        minHeight: '100%',
      }}
    >
      <Box
        gap="small"
        pad={{ vertical: 'medium', horizontal: 'large' }}
        round="24px"
        background="white"
        style={{
          border: '1px solid #d7e3f4',
          boxShadow: '0 24px 48px rgba(26, 74, 122, 0.10)',
        }}
      >
        <Box direction="row" justify="between" align="center" gap="medium">
          <Box gap="small">
            <Text
              size="tiny"
              weight="bold"
              style={{
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#1d4ed8',
              }}
            >
              Canvas LMS
            </Text>
            <Heading level={2} margin="none">
              {intl.formatMessage(messages.title)}
            </Heading>
            <Text>{intl.formatMessage(messages.subtitle)}</Text>
          </Box>
          <Box
            pad={{ vertical: 'small', horizontal: 'medium' }}
            round="999px"
            background="#edf4ff"
          >
            <Text weight="bold" color="#163c78">
              {intl.formatMessage(messages.videosCount, {
                count: currentVideos.length,
              })}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box direction="row" justify="end">
        <Button
          icon={<span className="material-icons">add_circle</span>}
          onClick={() =>
            createVideoMutation.mutate({
              playlist: playlistId,
              title: intl.formatMessage(messages.newVideoTitle),
              upload_state: uploadState.INITIALIZED,
              is_public: true,
            })
          }
          disabled={createVideoMutation.isLoading}
        >
          {intl.formatMessage(messages.addButton)}
        </Button>
      </Box>

      {apiResponse.isLoading && <BoxLoader />}
      {apiResponse.isError && (
        <BoxError message={intl.formatMessage(messages.genericError)} />
      )}

      {!apiResponse.isLoading && !currentVideos.length && (
        <Text>{intl.formatMessage(messages.empty)}</Text>
      )}

      <Grid columns="medium" gap="medium">
        {currentVideos.map((video) => (
          <GalleryVideoCard
            key={video.id}
            video={video}
            onEdit={() => navigate(builderGalleryVideoRoute(video.id))}
            onDelete={() => {
              if (window.confirm(intl.formatMessage(messages.deleteConfirmation))) {
                deleteVideoMutation.mutate({ ids: [video.id] });
              }
            }}
          />
        ))}
      </Grid>
    </Box>
  );
};

export const GalleryVideoEditor = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { videoId } = useParams();
  const [resourceContext] = useCurrentResourceContext();
  const addVideo = useVideoStore((state) => state.addResource);

  const videoResponse = useVideo(videoId || '', {
    enabled: !!videoId,
    onSuccess: (video) => addVideo(video),
    refetchInterval: 5000,
  });

  const scopedResourceContext = useMemo(
    () => ({
      ...resourceContext,
      resource_id: videoId || resourceContext.resource_id,
    }),
    [resourceContext, videoId],
  );

  if (videoResponse.isLoading) {
    return <BoxLoader />;
  }

  if (videoResponse.isError || !videoResponse.data) {
    return <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />;
  }

  const video = videoResponse.data;

  return (
    <CurrentResourceContextProvider value={scopedResourceContext}>
      <Box pad="medium" gap="medium">
        <Box direction="row" justify="start">
          <Button
            color="secondary"
            icon={<span className="material-icons">arrow_back</span>}
            onClick={() => navigate(GALLERY_MANAGER_ROUTE.default)}
          >
            {intl.formatMessage(messages.backToGallery)}
          </Button>
        </Box>

        {video.upload_state === uploadState.INITIALIZED ? (
          <Box align="center" justify="center" pad={{ vertical: 'medium' }}>
            <Box style={{ width: '100%', maxWidth: '960px' }}>
              <CreateVOD
                video={video}
                onUploadSuccess={() =>
                  navigate(builderGalleryVideoRoute(video.id), { replace: true })
                }
                onPreviousButtonClick={() =>
                  navigate(GALLERY_MANAGER_ROUTE.default)
                }
              />
            </Box>
          </Box>
        ) : (
          <DashboardVideoWrapper video={video} />
        )}
      </Box>
    </CurrentResourceContextProvider>
  );
};

export default GalleryManager;
