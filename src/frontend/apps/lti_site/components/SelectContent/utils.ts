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

interface LtiLinkItemContentItemsStructure {
  '@context': string;
  '@graph': {
    '@type': 'LtiLinkItem';
    url: string;
    mediaType: 'application/vnd.ims.lti.v1.ltilink';
    title?: Nullable<string>;
    text?: Nullable<string>;
    placementAdvice: {
      presentationDocumentTarget: 'iframe' | 'window';
    };
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
    returnTypes.split(',').includes('iframe')
  );
};

export const buildContentItems = (
  ltiUrl: string,
  title: Nullable<string>,
  description: Nullable<string>,
  ltiSelectFormData: {
    [key: string]: string;
  },
  setContentItemsValue: (value: string) => void,
  mode: LtiSelectContentMode = LtiSelectContentMode.DEFAULT,
) => {
  const { contentTitle, contentDescription } = getContentTitleAndDescription(
    title,
    description,
    ltiSelectFormData,
  );

  if (mode !== LtiSelectContentMode.DEFAULT) {
    const contentItems: LtiLinkItemContentItemsStructure = {
      '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
      '@graph': [
        {
          '@type': 'LtiLinkItem',
          url: ltiUrl,
          mediaType: 'application/vnd.ims.lti.v1.ltilink',
          placementAdvice: {
            presentationDocumentTarget:
              mode === LtiSelectContentMode.EMBED ? 'iframe' : 'window',
          },
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
    return;
  }

  const contentItems: DefaultContentItemsStructure = {
    '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
    '@graph': [
      {
        '@type': 'ContentItem',
        url: ltiUrl,
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
