import { Button } from '@openfun/cunningham-react';
import { Document as DocumentIcon } from 'grommet-icons';
import { Nullable } from 'lib-common';
import {
  Box,
  ContentCard,
  Document,
  Grid,
  PlaySVG,
  Text,
  Video,
  WebinarSVG,
  videoSize,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  LtiSelectContentMode,
  buildPublicVideoUrl,
  buildPublicVideoIframe,
  buildContentItems,
  canEmbedLtiLinkItem,
} from '../utils';

const messages = defineMessages({
  select: {
    defaultMessage: 'Select {content_title}',
    description: `Title used for a video or a document select.`,
    id: 'components.SelectContent.SelectContentSection.select',
  },
  insertLink: {
    defaultMessage: 'Insert link',
    description: 'Button label used to insert a video as an LTI link.',
    id: 'components.SelectContent.SelectContentSection.insertLink',
  },
  insertEmbed: {
    defaultMessage: 'Insert embed',
    description: 'Button label used to insert a video as an iframe embed.',
    id: 'components.SelectContent.SelectContentSection.insertEmbed',
  },
});

type ContentCardContent = Video | Document;
const isVideoGuard = (content: ContentCardContent): content is Video => {
  return (
    (content as Video).thumbnail !== undefined ||
    (content as Video).urls !== undefined
  );
};

const SelectContentCard = ({
  content,
  onClick,
}: {
  content: ContentCardContent;
  onClick: () => void;
}) => {
  const intl = useIntl();

  let thumbnail;
  let header;
  if (isVideoGuard(content)) {
    const thumbnailUrls =
      (content.thumbnail &&
        content.thumbnail.is_ready_to_show &&
        content.thumbnail.urls) ||
      content.urls?.thumbnails;

    if (thumbnailUrls) {
      const resolutions = Object.keys(thumbnailUrls).map(
        (size) => Number(size) as videoSize,
      );
      thumbnail =
        thumbnailUrls && resolutions
          ? thumbnailUrls[resolutions[0]]
          : undefined;
    }

    header = (
      <Box
        aria-label="thumbnail"
        role="img"
        width="100%"
        height="150px"
        align="center"
        justify="center"
        background={`
          ${
            thumbnail
              ? `url(${thumbnail}) no-repeat center / cover`
              : `radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)`
          }
        `}
      >
        {content.is_live ? (
          <WebinarSVG width={80} height={80} iconColor="white" />
        ) : (
          <PlaySVG width={80} height={80} iconColor="white" />
        )}
      </Box>
    );
  } else {
    header = (
      <Box
        width="100%"
        height="150px"
        align="center"
        justify="center"
        background="radial-gradient(ellipse at center, #45a3ff 0%,#2169ff 100%)"
      >
        <DocumentIcon size="large" color="white" />
      </Box>
    );
  }

  return (
    <ContentCard
      aria-label={intl.formatMessage(messages.select, {
        content_title: content.title,
      })}
      onClick={onClick}
      header={header}
      title={content.title || ''}
    >
      {content.description && (
        <Text
          size="small"
          truncate={5}
          color="grey"
          title={content.description}
        >
          {content.description}
        </Text>
      )}
    </ContentCard>
  );
};

export interface SelectContentSectionProps {
  addMessage: string;
  addAndSelectContent: () => void;
  newLtiUrl: string;
  items: Nullable<Video[] | Document[]>;
  lti_select_form_data: {
    [key: string]: string;
  };
  setContentItemsValue: (value: string) => void;
  showAddButton?: boolean;
}

export const SelectContentSection = ({
  addMessage,
  addAndSelectContent,
  items,
  lti_select_form_data,
  setContentItemsValue,
  showAddButton = true,
}: SelectContentSectionProps) => {
  const intl = useIntl();
  const canEmbed = canEmbedLtiLinkItem(lti_select_form_data);
  const filteredItems = items?.filter((item) =>
    isVideoGuard(item)
      ? item.is_public && item.is_ready_to_show && item.upload_state === 'ready'
      : true,
  );

  return (
    <Box
      gap="medium"
      pad={{ vertical: 'small' }}
      style={{
        background:
          'linear-gradient(180deg, rgba(247,250,255,1) 0%, rgba(255,255,255,1) 100%)',
        borderRadius: '18px',
      }}
    >
      {showAddButton && (
        <Box margin={{ vertical: 'small' }}>
          <Button
            icon={<span className="material-icons">add_circle</span>}
            onClick={addAndSelectContent}
            type="button"
            color="primary"
            style={{ alignSelf: 'start' }}
          >
            {addMessage}
          </Button>
        </Box>
      )}
      <Grid columns="small" gap="medium">
        {filteredItems?.map(
          (item: Video | Document, index: React.Key | null | undefined) => (
            <Box key={index} gap="xsmall">
              <SelectContentCard
                content={item}
                onClick={() =>
                  buildContentItems(
                    isVideoGuard(item)
                      ? buildPublicVideoUrl(item.id)
                      : item.lti_url || '',
                    item.title,
                    item.description,
                    lti_select_form_data,
                    setContentItemsValue,
                  )
                }
              />
              {isVideoGuard(item) && (
                <Box
                  gap="small"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: canEmbed ? '1fr 1fr' : '1fr',
                    width: '100%',
                  }}
                >
                  <Button
                    type="button"
                    fullWidth
                    icon={<span className="material-icons">link</span>}
                    onClick={() =>
                      buildContentItems(
                        buildPublicVideoUrl(item.id),
                        item.title,
                        item.description,
                        lti_select_form_data,
                        setContentItemsValue,
                        LtiSelectContentMode.LINK,
                      )
                    }
                  >
                    {intl.formatMessage(messages.insertLink)}
                  </Button>
                  {canEmbed && (
                    <Button
                      type="button"
                      color="secondary"
                      fullWidth
                      icon={<span className="material-icons">code</span>}
                      onClick={() =>
                        buildContentItems(
                          buildPublicVideoIframe(item.id, item.is_live),
                          item.title,
                          item.description,
                          lti_select_form_data,
                          setContentItemsValue,
                          LtiSelectContentMode.EMBED,
                        )
                      }
                    >
                      {intl.formatMessage(messages.insertEmbed)}
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          ),
        )}
      </Grid>
    </Box>
  );
};
