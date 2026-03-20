import {
  LtiSelectContentMode,
  buildContentItems,
  canEmbedLtiLinkItem,
} from './utils';

const mockSetContentItemsValue = jest.fn();

describe('buildContentItems', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it('builds content items from title and description', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {},
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'Custom select content title',
            text: 'Custom select content description',
          },
        ],
      }),
    );
  });

  it('builds content items from lti select form data', () => {
    buildContentItems(
      'https://example.com/lti',
      null,
      null,
      {
        activity_title: 'lti activity title',
        activity_description: 'lti activity description',
      },
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'lti activity title',
            text: 'lti activity description',
          },
        ],
      }),
    );
  });

  it('uses lti select form data othe title and description', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {
        activity_title: 'lti activity title',
        activity_description: 'lti activity description',
      },
      mockSetContentItemsValue,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'ContentItem',
            url: 'https://example.com/lti',
            frame: [],
            title: 'lti activity title',
            text: 'lti activity description',
          },
        ],
      }),
    );
  });

  it('builds LTI link items for link insertion', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {},
      mockSetContentItemsValue,
      LtiSelectContentMode.LINK,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'LtiLinkItem',
            url: 'https://example.com/lti',
            mediaType: 'application/vnd.ims.lti.v1.ltilink',
            placementAdvice: {
              presentationDocumentTarget: 'window',
            },
            title: 'Custom select content title',
            text: 'Custom select content description',
          },
        ],
      }),
    );
  });

  it('builds LTI link items for embed insertion', () => {
    buildContentItems(
      'https://example.com/lti',
      'Custom select content title',
      'Custom select content description',
      {},
      mockSetContentItemsValue,
      LtiSelectContentMode.EMBED,
    );

    expect(mockSetContentItemsValue).toHaveBeenCalledWith(
      JSON.stringify({
        '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
        '@graph': [
          {
            '@type': 'LtiLinkItem',
            url: 'https://example.com/lti',
            mediaType: 'application/vnd.ims.lti.v1.ltilink',
            placementAdvice: {
              presentationDocumentTarget: 'iframe',
            },
            title: 'Custom select content title',
            text: 'Custom select content description',
          },
        ],
      }),
    );
  });

  it('detects when the LMS can embed LTI links', () => {
    expect(
      canEmbedLtiLinkItem({
        ext_content_return_types: 'oembed,lti_launch_url,url,image_url,iframe',
      }),
    ).toBe(true);
    expect(canEmbedLtiLinkItem({ selection_directive: 'embed_content' })).toBe(
      true,
    );
    expect(canEmbedLtiLinkItem({})).toBe(false);
  });
});
