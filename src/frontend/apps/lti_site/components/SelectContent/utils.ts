import { Nullable } from 'lib-common';

interface DefaultContentItemsStructure {
  '@context': string;
  '@graph': {
    '@type': string;
    url: string;
    title?: Nullable<string>;
    text?: Nullable<string>;
    frame: [];
  }[];
}

interface IframeContentItemsStructure {
  '@context': string;
  '@graph': {
    '@type': 'ContentItem';
    mediaType: 'text/html';
    html: string;
    text: string;
    title?: Nullable<string>;
  }[];
}

export enum LtiSelectContentMode {
  DEFAULT = 'default',
  LINK = 'link',
  EMBED = 'embed',
}

const getContentTitleAndDescription = (
  title: Nullable<string>,
  description: Nullable<string>,
  ltiSelectFormData: {
    [key: string]: string;
  },
) => {
  let contentTitle = title;
  let contentDescription = description;

  if (ltiSelectFormData?.activity_title) {
    contentTitle = ltiSelectFormData.activity_title;
  }
  if (ltiSelectFormData?.activity_description) {
    contentDescription = ltiSelectFormData.activity_description;
  }

  return {
    contentTitle,
    contentDescription,
  };
};

export const canEmbedLtiLinkItem = (ltiSelectFormData: {
  [key: string]: string;
}) => {
  const returnTypes = ltiSelectFormData?.ext_content_return_types || '';

  return (
    ltiSelectFormData?.selection_directive === 'embed_content' ||
    ltiSelectFormData?.ext_content_intended_use === 'embed' ||
    ltiSelectFormData?.launch_presentation_document_target === 'iframe' ||
    returnTypes.split(',').includes('iframe')
  );
};

export const buildPublicVideoUrl = (videoId: string) =>
  `${window.location.origin}/videos/${videoId}`;

export const buildPublicVideoIframe = (videoId: string, isLive = false) => {
  const publicVideoUrl = buildPublicVideoUrl(videoId);
  const parametersWebinar = isLive
    ? 'microphone *; camera *; midi *; display-capture *; '
    : '';

  return `<iframe src="${publicVideoUrl}" allowfullscreen="true" allow="${parametersWebinar}encrypted-media *; autoplay *; fullscreen *"></iframe>`;
};

export const buildContentItems = (
  url: string,
  title: Nullable<string>,
  description: Nullable<string>,
  ltiSelectFormData: {
    [key: string]: string;
  },
  setContentItemsValue: (value: string) => void,
  mode: LtiSelectContentMode = LtiSelectContentMode.DEFAULT,
  embedHtml?: string,
) => {
  const { contentTitle, contentDescription } = getContentTitleAndDescription(
    title,
    description,
    ltiSelectFormData,
  );

  if (mode === LtiSelectContentMode.EMBED) {
    const html = embedHtml || url;
    const contentItems: IframeContentItemsStructure = {
      '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
      '@graph': [
        {
          '@type': 'ContentItem',
          mediaType: 'text/html',
          html,
          text: html,
        },
      ],
    };

    if (contentTitle) {
      contentItems['@graph'][0].title = contentTitle;
    }

    setContentItemsValue(JSON.stringify(contentItems));
    return;
  }

  const contentItems: DefaultContentItemsStructure = {
    '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
    '@graph': [
      {
        '@type': 'ContentItem',
        url,
        frame: [],
      },
    ],
  };

  if (contentTitle) {
    contentItems['@graph'][0].title = contentTitle;
  }
  if (contentDescription) {
    contentItems['@graph'][0].text = contentDescription;
  }

  setContentItemsValue(JSON.stringify(contentItems));
};
