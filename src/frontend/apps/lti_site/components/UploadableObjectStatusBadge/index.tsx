import { normalizeColor } from 'grommet/utils';
import { colorsTokens, theme } from 'lib-common';
import {
  UploadManagerStatus,
  UploadableObject,
  uploadState,
  useUploadManager,
} from 'lib-components';
import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import styled from 'styled-components';

const messages = defineMessages({
  [uploadState.DELETED]: {
    defaultMessage: 'Deleted',
    description: 'Badge text for an uploadable object that was deleted.',
    id: 'components.UploadableObjectStatusBadge.deleted',
  },
  [uploadState.ERROR]: {
    defaultMessage: 'Error',
    description:
      'Badge text for an uploadable object that encountered an error.',
    id: 'components.UploadableObjectStatusBadge.error',
  },
  [uploadState.PENDING]: {
    defaultMessage: 'Pending',
    description:
      'Badge text for an uploadable object that has no file at all and is still pending.',
    id: 'components.UploadableObjectStatusBadge.pending',
  },
  [uploadState.PROCESSING]: {
    defaultMessage: 'Processing',
    description:
      'Badge text for an uploadable object that is currently processing',
    id: 'components.UploadableObjectStatusBadge.processing',
  },
  [uploadState.READY]: {
    defaultMessage: 'Ready',
    description: 'Badge text for an uploadable object that is ready.',
    id: 'components.UploadableObjectStatusBadge.ready',
  },
  uploading: {
    defaultMessage: 'Uploading',
    description:
      'Badge text for an uploadable object that is currently uploading.',
    id: 'components.UploadableObjectStatusBadge.uploading',
  },
});

const statusIcons = {
  [uploadState.DELETED]: 'delete',
  [uploadState.ERROR]: 'error',
  [uploadState.PENDING]: 'schedule',
  [uploadState.PROCESSING]: 'sync',
  [uploadState.READY]: 'check_circle',
  uploading: 'cloud_upload',
};

interface BadgeProps {
  background: string;
}

const Badge = styled.div`
  display: inline-block;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;

  background-color: ${({ background }: BadgeProps) =>
    normalizeColor(background, theme)};
`;

interface UploadableObjectStatusBadgeProps {
  object: UploadableObject;
  neutral?: boolean;
}

export const UploadableObjectStatusBadge = ({
  object,
  neutral = false,
}: UploadableObjectStatusBadgeProps) => {
  const { uploadManagerState } = useUploadManager();

  const renderBadge = (
    message:
      | typeof messages[uploadState.DELETED]
      | typeof messages[uploadState.ERROR]
      | typeof messages[uploadState.PENDING]
      | typeof messages[uploadState.PROCESSING]
      | typeof messages[uploadState.READY]
      | typeof messages.uploading,
    background: string,
    icon: string,
  ) => (
    <Badge
      role="status"
      background={neutral ? '#ffffff' : background}
      style={{
        color: neutral ? '#5f6b7a' : 'white',
        boxShadow: neutral ? '0 10px 24px rgba(15, 35, 64, 0.16)' : 'none',
      }}
    >
      <span
        className="material-icons"
        style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'bottom' }}
      >
        {icon}
      </span>
      <FormattedMessage {...message} />
    </Badge>
  );

  switch (object.upload_state) {
    case uploadState.READY:
      return renderBadge(
        messages[uploadState.READY],
        colorsTokens['success-600'],
        statusIcons[uploadState.READY],
      );

    case uploadState.DELETED:
    case uploadState.PROCESSING:
    case uploadState.INITIALIZED:
      return renderBadge(
        messages[
          object.upload_state === uploadState.INITIALIZED
            ? uploadState.PENDING
            : object.upload_state
        ],
        colorsTokens['info-300'],
        statusIcons[
          object.upload_state === uploadState.INITIALIZED
            ? uploadState.PENDING
            : object.upload_state
        ],
      );

    case uploadState.ERROR:
      return renderBadge(
        messages[uploadState.ERROR],
        colorsTokens['danger-400'],
        statusIcons[uploadState.ERROR],
      );

    case uploadState.PENDING:
      switch (uploadManagerState[object.id]?.status) {
        case UploadManagerStatus.INIT:
        case UploadManagerStatus.UPLOADING:
          return renderBadge(
            messages.uploading,
            colorsTokens['info-300'],
            statusIcons.uploading,
          );

        case UploadManagerStatus.ERR_POLICY:
        case UploadManagerStatus.ERR_UPLOAD:
          return renderBadge(
            messages[uploadState.ERROR],
            colorsTokens['danger-400'],
            statusIcons[uploadState.ERROR],
          );

        case UploadManagerStatus.ERR_SIZE:
          return renderBadge(
            messages[uploadState.ERROR],
            colorsTokens['danger-400'],
            statusIcons[uploadState.ERROR],
          );

        case UploadManagerStatus.SUCCESS:
          return renderBadge(
            messages[uploadState.PROCESSING],
            colorsTokens['info-300'],
            statusIcons[uploadState.PROCESSING],
          );

        default:
          return renderBadge(
            messages[uploadState.PENDING],
            colorsTokens['greyscale-700'],
            statusIcons[uploadState.PENDING],
          );
      }

    default:
      throw new Error('Unexpected object status in object status badge.');
  }
};
