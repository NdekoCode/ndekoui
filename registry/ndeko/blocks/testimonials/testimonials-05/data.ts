export type Trend = 'down' | 'up';

/** A change measured in percent: the label carries its direction, "fewer late deliveries". */
export type Result = {
  percent: number;
  trend: Trend;
  label: string;
};

export type Customer = {
  id: string;
  person: {
    name: string;
    role: string;
  };
  company: string;
  short: string;
  long: string;
  result: Result;
};

export const SECTION = {
  label: 'Customer results',
  title: 'What changed for the teams that route with Routewise',
  lead: 'Dispatchers and owners on the months after they switched, each with the number they watched.',
};

/** Invented people, companies and results. The figures are illustrative. */
export const CUSTOMERS: Customer[] = [
  {
    id: 'kestrel',
    person: { name: 'Ruth Okonkwo', role: 'Dispatch lead' },
    company: 'Kestrel Couriers',
    short:
      'Late deliveries stopped being the first thing we talk about on Mondays.',
    long: 'We plan eighty routes before six in the morning. Routewise rebuilds them when a driver calls in sick, and late deliveries stopped being the first thing we talk about on Mondays.',
    result: { percent: 31, trend: 'down', label: 'fewer late deliveries' },
  },
  {
    id: 'greenlane',
    person: { name: 'Henrik Aalto', role: 'Fleet manager' },
    company: 'Greenlane Grocers',
    short: 'Our vans cross the river once a morning instead of four times.',
    long: 'It found that our vans crossed the river four times a morning. The new routes cross it once, and the fuel bill shows it every month.',
    result: { percent: 18, trend: 'down', label: 'less fuel per route' },
  },
  {
    id: 'oakmere',
    person: { name: 'Lucía Romero', role: 'Owner' },
    company: 'Oakmere Florists',
    short: 'Customers get a live link instead of calling the shop.',
    long: 'Customers used to call to ask where their flowers were. Now they get a link with the van on a map, and the phone rings for orders instead.',
    result: { percent: 44, trend: 'down', label: 'fewer calls about the van' },
  },
  {
    id: 'tidal',
    person: { name: 'Samir Qureshi', role: 'Operations director' },
    company: 'Tidal Parcels',
    short: 'Same drivers, same hours, more parcels at the door.',
    long: 'We did not hire for peak season this year. The same drivers make more stops in the same hours, because nobody drives back across town for a missed parcel.',
    result: { percent: 27, trend: 'up', label: 'more stops per driver' },
  },
  {
    id: 'hillcrest',
    person: { name: 'Joanna Wiśniewska', role: 'Delivery coordinator' },
    company: 'Hillcrest Pharmacy',
    short: 'I check the plan now instead of drawing it on a map.',
    long: 'I used to draw the routes on a printed map. Now I check the plan Routewise drafts, move one or two stops and send it to the drivers’ phones.',
    result: {
      percent: 63,
      trend: 'down',
      label: 'fewer routes planned by hand',
    },
  },
  {
    id: 'ferro',
    person: { name: 'Marco Bianchi', role: 'Yard manager' },
    company: 'Ferro Builders Supply',
    short: 'Site managers trust the time window we give them.',
    long: 'Building sites give us a two hour window. Routewise plans around the cranes and the school runs, so we keep the window far more often than we miss it.',
    result: { percent: 12, trend: 'down', label: 'fewer missed time slots' },
  },
];
