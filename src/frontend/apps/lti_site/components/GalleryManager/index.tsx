import { Button, Checkbox, Field, Input, TextArea } from '@openfun/cunningham-react';
import {
  Box,
  BoxError,
  BoxLoader,
  Grid,
  Heading,
  Text,
  modelName,
  uploadState,
  uploadEnded,
  useAppConfig,
  useUploadManager,
} from 'lib-components';
import {
  VideosOrderType,
  useDeleteVideo,
  useUpdateVideo,
  useVideos,
} from 'lib-video';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { useCreateVideo } from '@lib-video/api/useCreateVideo';

import { UploadableObjectStatusBadge } from 'components/UploadableObjectStatusBadge';

const messages = defineMessages({
  title: {
    defaultMessage: 'Course video gallery',
    description: 'Title for the LTI gallery manager page.',
    id: 'components.GalleryManager.title',
  },
  subtitle: {
    defaultMessage:
      'Manage the videos attached to this LMS course: create, upload, update and delete them from here.',
    description: 'Subtitle for the LTI gallery manager page.',
    id: 'components.GalleryManager.subtitle',
  },
  empty: {
    defaultMessage: 'There is no video in this course yet.',
    description: 'Message shown when there is no video in the current playlist.',
    id: 'components.GalleryManager.empty',
  },
  addTitle: {
    defaultMessage: 'Add a video',
    description: 'Title for the create video form.',
    id: 'components.GalleryManager.addTitle',
  },
  titleLabel: {
    defaultMessage: 'Title',
    description: 'Label for the video title field.',
    id: 'components.GalleryManager.titleLabel',
  },
  descriptionLabel: {
    defaultMessage: 'Description',
    description: 'Label for the video description field.',
    id: 'components.GalleryManager.descriptionLabel',
  },
  publicLabel: {
    defaultMessage: 'Publicly available',
    description: 'Label for public visibility checkbox.',
    id: 'components.GalleryManager.publicLabel',
  },
  fileLabel: {
    defaultMessage: 'Video file',
    description: 'Label for the video file input.',
    id: 'components.GalleryManager.fileLabel',
  },
  createButton: {
    defaultMessage: 'Create and upload',
    description: 'Button label to create a new video.',
    id: 'components.GalleryManager.createButton',
  },
  editButton: {
    defaultMessage: 'Edit',
    description: 'Button label to edit a video.',
    id: 'components.GalleryManager.editButton',
  },
  saveButton: {
    defaultMessage: 'Save',
    description: 'Button label to save changes.',
    id: 'components.GalleryManager.saveButton',
  },
  cancelButton: {
    defaultMessage: 'Cancel',
    description: 'Button label to cancel changes.',
    id: 'components.GalleryManager.cancelButton',
  },
  deleteButton: {
    defaultMessage: 'Delete',
    description: 'Button label to delete a video.',
    id: 'components.GalleryManager.deleteButton',
  },
  replaceButton: {
    defaultMessage: 'Replace file',
    description: 'Button label to upload a new source file.',
    id: 'components.GalleryManager.replaceButton',
  },
  createSuccess: {
    defaultMessage: 'Video created.',
    description: 'Toast shown after creating a video.',
    id: 'components.GalleryManager.createSuccess',
  },
  updateSuccess: {
    defaultMessage: 'Video updated.',
    description: 'Toast shown after updating a video.',
    id: 'components.GalleryManager.updateSuccess',
  },
  deleteSuccess: {
    defaultMessage: 'Video deleted.',
    description: 'Toast shown after deleting a video.',
    id: 'components.GalleryManager.deleteSuccess',
  },
  genericError: {
    defaultMessage: 'Sorry, an error occurred. Please try again.',
    description: 'Fallback error message for gallery actions.',
    id: 'components.GalleryManager.genericError',
  },
});

type VideoFormValues = {
  title: string;
  description: string;
  is_public: boolean;
};

const buildDefaultValues = (video?: {
  title: string | null;
  description: string | null;
  is_public: boolean;
}): VideoFormValues => ({
  title: video?.title || '',
  description: video?.description || '',
  is_public: video?.is_public || false,
});

const uploadVideoFile = (
  addUpload: ReturnType<typeof useUploadManager>['addUpload'],
  videoId: string,
  file: File,
) => {
  addUpload(modelName.VIDEOS, videoId, file, undefined, (presignedPost) => {
    uploadEnded(modelName.VIDEOS, videoId, presignedPost.fields['key']);
  });
};

export const GalleryManager = () => {
  const intl = useIntl();
  const appData = useAppConfig();
  const { addUpload } = useUploadManager();
  const playlistId = appData.playlist?.id || '';
  const [createValues, setCreateValues] = useState<VideoFormValues>(
    buildDefaultValues(),
  );
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<VideoFormValues>(
    buildDefaultValues(),
  );

  const apiResponse = useVideos(
    {
      playlist: playlistId,
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
      if (createFile) {
        uploadVideoFile(addUpload, video.id, createFile);
      }
      setCreateValues(buildDefaultValues());
      setCreateFile(null);
      toast.success(intl.formatMessage(messages.createSuccess), {
        position: 'bottom-center',
      });
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.genericError), {
        position: 'bottom-center',
      });
    },
  });

  const deleteVideoMutation = useDeleteVideo({
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

  const updatingVideoMutation = useUpdateVideo(editingId || '', {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.updateSuccess), {
        position: 'bottom-center',
      });
      setEditingId(null);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.genericError), {
        position: 'bottom-center',
      });
    },
  });

  const currentVideos = useMemo(
    () => apiResponse.data?.results || [],
    [apiResponse.data?.results],
  );

  if (!playlistId) {
    return <BoxError message={intl.formatMessage(messages.genericError)} />;
  }

  return (
    <Box pad="medium" gap="medium">
      <Box gap="xsmall">
        <Heading level={2}>{intl.formatMessage(messages.title)}</Heading>
        <Text>{intl.formatMessage(messages.subtitle)}</Text>
      </Box>

      <Box
        pad="medium"
        background="white"
        round="xsmall"
        border={{ color: 'light-4' }}
        gap="small"
      >
        <Heading level={3} margin="none">
          {intl.formatMessage(messages.addTitle)}
        </Heading>

        <Field fullWidth>
          <Input
            aria-label={intl.formatMessage(messages.titleLabel)}
            label={intl.formatMessage(messages.titleLabel)}
            value={createValues.title}
            onChange={(event) =>
              setCreateValues((value) => ({
                ...value,
                title: event.target.value,
              }))
            }
          />
        </Field>

        <Field fullWidth>
          <TextArea
            label={intl.formatMessage(messages.descriptionLabel)}
            rows={4}
            value={createValues.description}
            onChange={(event) =>
              setCreateValues((value) => ({
                ...value,
                description: event.target.value,
              }))
            }
          />
        </Field>

        <Checkbox
          label={intl.formatMessage(messages.publicLabel)}
          checked={createValues.is_public}
          onChange={(event) =>
            setCreateValues((value) => ({
              ...value,
              is_public: event.target.checked,
            }))
          }
        />

        <Field label={intl.formatMessage(messages.fileLabel)} fullWidth>
          <input
            aria-label={intl.formatMessage(messages.fileLabel)}
            type="file"
            accept="video/*"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setCreateFile(event.target.files?.[0] || null)
            }
          />
        </Field>

        <Box direction="row" justify="end">
          <Button
            onClick={() =>
              createVideoMutation.mutate({
                playlist: playlistId,
                title: createValues.title.trim(),
                description: createValues.description.trim() || undefined,
                is_public: createValues.is_public,
                upload_state: uploadState.INITIALIZED,
              } as any)
            }
            disabled={!createValues.title.trim() || createVideoMutation.isLoading}
          >
            {intl.formatMessage(messages.createButton)}
          </Button>
        </Box>
      </Box>

      {apiResponse.isLoading && <BoxLoader />}
      {apiResponse.isError && (
        <BoxError message={intl.formatMessage(messages.genericError)} />
      )}

      {!apiResponse.isLoading && !currentVideos.length && (
        <Text>{intl.formatMessage(messages.empty)}</Text>
      )}

      <Grid columns="medium" gap="medium">
        {currentVideos.map((video) => {
          const thumbnail =
            video.thumbnail?.urls?.[240] || video.urls?.thumbnails?.[240];
          const isEditing = editingId === video.id;

          return (
            <Box
              key={video.id}
              pad="medium"
              gap="small"
              background="white"
              round="xsmall"
              border={{ color: 'light-4' }}
            >
              <Box
                height="160px"
                round="xsmall"
                background={
                  thumbnail
                    ? `url(${thumbnail}) center / cover`
                    : 'linear-gradient(135deg, #45a3ff 0%, #2169ff 100%)'
                }
              />

              <Box direction="row" justify="between" align="start" gap="small">
                <Box gap="xxsmall">
                  <Text weight="bold">{video.title || '-'}</Text>
                  {video.description && (
                    <Text size="small" color="dark-5">
                      {video.description}
                    </Text>
                  )}
                </Box>
                <UploadableObjectStatusBadge object={video} />
              </Box>

              {isEditing ? (
                <Box gap="small">
                  <Field fullWidth>
                    <Input
                      aria-label={intl.formatMessage(messages.titleLabel)}
                      label={intl.formatMessage(messages.titleLabel)}
                      value={editingValues.title}
                      onChange={(event) =>
                        setEditingValues((value) => ({
                          ...value,
                          title: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field fullWidth>
                    <TextArea
                      label={intl.formatMessage(messages.descriptionLabel)}
                      rows={4}
                      value={editingValues.description}
                      onChange={(event) =>
                        setEditingValues((value) => ({
                          ...value,
                          description: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Checkbox
                    label={intl.formatMessage(messages.publicLabel)}
                    checked={editingValues.is_public}
                    onChange={(event) =>
                      setEditingValues((value) => ({
                        ...value,
                        is_public: event.target.checked,
                      }))
                    }
                  />
                  <Box direction="row" gap="small" justify="end">
                    <Button onClick={() => setEditingId(null)}>
                      {intl.formatMessage(messages.cancelButton)}
                    </Button>
                    <Button
                      onClick={() =>
                        updatingVideoMutation.mutate({
                          title: editingValues.title.trim(),
                          description:
                            editingValues.description.trim() || undefined,
                          is_public: editingValues.is_public,
                        } as any)
                      }
                      disabled={!editingValues.title.trim()}
                    >
                      {intl.formatMessage(messages.saveButton)}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box direction="row" gap="small" wrap>
                  <Button
                    onClick={() => {
                      setEditingId(video.id);
                      setEditingValues(
                        buildDefaultValues({
                          title: video.title,
                          description: video.description,
                          is_public: video.is_public,
                        }),
                      );
                    }}
                  >
                    {intl.formatMessage(messages.editButton)}
                  </Button>
                  <label>
                    <Text size="small" weight="bold">
                      {intl.formatMessage(messages.replaceButton)}
                    </Text>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          uploadVideoFile(addUpload, video.id, file);
                        }
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <Button onClick={() => deleteVideoMutation.mutate(video.id)}>
                    {intl.formatMessage(messages.deleteButton)}
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
};

export default GalleryManager;
