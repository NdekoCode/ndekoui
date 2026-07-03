import { REPOSITORY_URL } from '@/app/_site/repository';
import {
  absoluteUrlOf,
  AUTHOR_NAME,
  AUTHOR_URL,
  SITE_NAME,
} from '@/app/_site/seo';

import { FAQ_QUESTIONS } from './home-faq';

const WEBSITE_ID = absoluteUrlOf('/#website');
const LIBRARY_ID = absoluteUrlOf('/#library');
const AUTHOR_ID = `${AUTHOR_URL}/#person`;

const MIT_LICENCE_URL = 'https://opensource.org/licenses/MIT';

function faqItemOf(entry: { question: string; answer: string }) {
  return {
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer },
  };
}

/** What the home page says about the library, in schema.org terms: the site, the code, its author, the questions. */
export function homeStructuredDataOf(description: string) {
  const siteUrl = absoluteUrlOf('/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SITE_NAME,
        url: siteUrl,
        description,
        inLanguage: 'en',
        publisher: { '@id': AUTHOR_ID },
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': LIBRARY_ID,
        name: SITE_NAME,
        description,
        url: siteUrl,
        codeRepository: REPOSITORY_URL,
        license: MIT_LICENCE_URL,
        programmingLanguage: ['TypeScript', 'React'],
        runtimePlatform: 'React',
        author: { '@id': AUTHOR_ID },
      },
      {
        '@type': 'Person',
        '@id': AUTHOR_ID,
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_QUESTIONS.map(faqItemOf),
      },
    ],
  };
}
