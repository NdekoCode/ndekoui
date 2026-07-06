export type SectionId = 'profile' | 'contact' | 'region';

export type WeekStart = 'monday' | 'sunday';

export type TimeFormat = '24h' | '12h';

export type ProfileValues = {
  photo: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  showEmail: boolean;
  language: string;
  timeZone: string;
  weekStart: WeekStart;
  timeFormat: TimeFormat;
};

export type ProfileField = keyof ProfileValues;

export const INITIAL_PROFILE: ProfileValues = {
  photo: '',
  name: 'Amara Okafor',
  username: 'amara',
  title: 'Product designer',
  bio: 'Designs the onboarding and the reports. Ask me about empty states.',
  email: 'amara.okafor@tidewell.example',
  phone: '',
  showEmail: true,
  language: 'en-GB',
  timeZone: 'africa-lagos',
  weekStart: 'monday',
  timeFormat: '24h',
};

export const PROFILE_HOST = 'tidewell.example/';

export const BIO_MAX_LENGTH = 160;

const MEGABYTE = 1024 * 1024;

export const PHOTO_MAX_BYTES = 2 * MEGABYTE;

export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const SECTION_KEYS: Record<SectionId, ProfileField[]> = {
  profile: ['photo', 'name', 'username', 'title', 'bio'],
  contact: ['email', 'phone', 'showEmail'],
  region: ['language', 'timeZone', 'weekStart', 'timeFormat'],
};

export const LANGUAGES = [
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'pt-PT', label: 'Português' },
  { value: 'sw', label: 'Kiswahili' },
];

export const TIME_ZONES = [
  { value: 'africa-lagos', label: 'Lagos, West Africa Time' },
  { value: 'africa-kinshasa', label: 'Kinshasa, West Africa Time' },
  { value: 'europe-london', label: 'London, Greenwich Mean Time' },
  { value: 'europe-paris', label: 'Paris, Central European Time' },
  { value: 'america-new-york', label: 'New York, Eastern Time' },
  { value: 'asia-tokyo', label: 'Tokyo, Japan Standard Time' },
];

export const WEEK_STARTS: { value: WeekStart; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
];

export const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: '24h', label: '24-hour' },
  { value: '12h', label: '12-hour' },
];

export const TIME_FORMAT_SAMPLE: Record<TimeFormat, string> = {
  '24h': 'A meeting at half past two shows as 14:30',
  '12h': 'A meeting at half past two shows as 2:30 PM',
};
