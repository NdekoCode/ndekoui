/*
 * Cloudflare sits in front of the site, so the address the deployment sees is a Cloudflare one. These are
 * the ranges Cloudflare publishes at https://www.cloudflare.com/ips. A request from outside them did not
 * come through Cloudflare, so what it says about the visitor cannot be believed.
 *
 * If Cloudflare adds a range that is missing here, its requests are simply counted under the Cloudflare
 * address instead of the visitor's: the count is shared, never forged.
 */
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

type IpVersion = 4 | 6;

/** An IPv4 address as 4 numbers of 8 bits, an IPv6 address as 8 numbers of 16 bits. */
type Address = { version: IpVersion; words: number[] };

type Range = Address & { prefixLength: number };

const BITS_PER_WORD = { 4: 8, 6: 16 };

const IPV4_OCTET = /^(0|[1-9]\d{0,2})$/;

const IPV6_GROUP = /^[0-9a-f]{1,4}$/i;

const IPV6_WORD_COUNT = 8;

function ipv4WordsOf(text: string) {
  const parts = text.split('.');
  if (parts.length !== 4) {
    return null;
  }
  const words: number[] = [];
  for (const part of parts) {
    const isOctet = IPV4_OCTET.test(part);
    if (!isOctet) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    words.push(octet);
  }
  return words;
}

/** The groups of one side of an IPv6 address, or null when one of them is not hexadecimal. */
function ipv6GroupsOf(text: string) {
  if (text === '') {
    return [];
  }
  const groups = text.split(':');
  for (const group of groups) {
    const isGroup = IPV6_GROUP.test(group);
    if (!isGroup) {
      return null;
    }
  }
  return groups.map((group) => parseInt(group, 16));
}

function ipv6WordsOf(text: string) {
  const sides = text.split('::');
  if (sides.length > 2) {
    return null;
  }
  const head = ipv6GroupsOf(sides[0]);
  if (head === null) {
    return null;
  }
  const hasGap = sides.length === 2;
  if (!hasGap) {
    if (head.length !== IPV6_WORD_COUNT) {
      return null;
    }
    return head;
  }
  const tail = ipv6GroupsOf(sides[1]);
  if (tail === null) {
    return null;
  }
  const gapLength = IPV6_WORD_COUNT - head.length - tail.length;
  if (gapLength < 1) {
    return null;
  }
  const gap = new Array<number>(gapLength).fill(0);
  return [...head, ...gap, ...tail];
}

function addressOf(text: string): Address | null {
  const isIpv6 = text.includes(':');
  if (isIpv6) {
    const words = ipv6WordsOf(text);
    if (words === null) {
      return null;
    }
    return { version: 6, words };
  }
  const words = ipv4WordsOf(text);
  if (words === null) {
    return null;
  }
  return { version: 4, words };
}

function rangeOf(text: string): Range | null {
  const [addressText, prefixText] = text.split('/');
  const address = addressOf(addressText);
  if (address === null) {
    return null;
  }
  const prefixLength = Number(prefixText);
  const bitCount = BITS_PER_WORD[address.version] * address.words.length;
  const isWholeNumber = Number.isInteger(prefixLength);
  const isAboveZero = prefixLength >= 0;
  const isWithinAddress = prefixLength <= bitCount;
  const isValidPrefix = isWholeNumber && isAboveZero && isWithinAddress;
  if (!isValidPrefix) {
    return null;
  }
  return { ...address, prefixLength };
}

function parsedRangesOf(texts: string[]) {
  const ranges: Range[] = [];
  for (const text of texts) {
    const range = rangeOf(text);
    if (range !== null) {
      ranges.push(range);
    }
  }
  return ranges;
}

const parsedRanges = parsedRangesOf(CLOUDFLARE_RANGES);

/** True when the first `prefixLength` bits of the address are the range's. */
function isInside(address: Address, range: Range) {
  if (address.version !== range.version) {
    return false;
  }
  const bitsPerWord = BITS_PER_WORD[range.version];
  const wholeWords = Math.floor(range.prefixLength / bitsPerWord);
  const extraBits = range.prefixLength % bitsPerWord;
  for (let index = 0; index < wholeWords; index += 1) {
    if (address.words[index] !== range.words[index]) {
      return false;
    }
  }
  if (extraBits === 0) {
    return true;
  }
  const shift = bitsPerWord - extraBits;
  const addressStart = address.words[wholeWords] >> shift;
  const rangeStart = range.words[wholeWords] >> shift;
  return addressStart === rangeStart;
}

/** True when the address is one of Cloudflare's, which means the request came through Cloudflare. */
export function isCloudflareAddress(text: string) {
  const address = addressOf(text);
  if (address === null) {
    return false;
  }
  return parsedRanges.some((range) => isInside(address, range));
}
