import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

type Country = {
  value: string;
  name: string;
};

const CONTINENTS: { name: string; countries: Country[] }[] = [
  {
    name: 'America',
    countries: [
      { value: 'US', name: 'United States' },
      { value: 'CA', name: 'Canada' },
      { value: 'MX', name: 'Mexico' },
    ],
  },
  {
    name: 'Africa',
    countries: [
      { value: 'ZA', name: 'South Africa' },
      { value: 'NG', name: 'Nigeria' },
      { value: 'MA', name: 'Morocco' },
    ],
  },
  {
    name: 'Asia',
    countries: [
      { value: 'CN', name: 'China' },
      { value: 'JP', name: 'Japan' },
      { value: 'IN', name: 'India' },
    ],
  },
  {
    name: 'Europe',
    countries: [
      { value: 'GB', name: 'United Kingdom' },
      { value: 'FR', name: 'France' },
      { value: 'DE', name: 'Germany' },
    ],
  },
  {
    name: 'Oceania',
    countries: [
      { value: 'AU', name: 'Australia' },
      { value: 'NZ', name: 'New Zealand' },
    ],
  },
];

function CountryName({ country }: { country: Country }) {
  return (
    <span className='flex min-w-0 items-center gap-2'>
      <span
        aria-hidden='true'
        className='bg-foreground/[0.06] text-muted-foreground inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-medium'
      >
        {country.value}
      </span>
      <span className='truncate'>{country.name}</span>
    </span>
  );
}

function countryItemOf(country: Country) {
  return {
    value: country.value,
    label: <CountryName country={country} />,
  };
}

const COUNTRIES = CONTINENTS.flatMap((continent) => continent.countries);

const COUNTRY_ITEMS = COUNTRIES.map(countryItemOf);

export default function Select37() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Country</FieldLabel>
      <Select items={COUNTRY_ITEMS} defaultValue='CA'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a country' />
        </SelectTrigger>
        <SelectContent>
          {CONTINENTS.map((continent) => (
            <SelectGroup key={continent.name}>
              <SelectLabel>{continent.name}</SelectLabel>
              {continent.countries.map((country) => (
                <SelectItem
                  key={country.value}
                  value={country.value}
                  label={country.name}
                >
                  <CountryName country={country} />
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
