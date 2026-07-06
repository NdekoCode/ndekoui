import { FEATURE_GROUPS } from './data';

export function FeatureTable() {
  return (
    <table className='w-full text-[13px]'>
      <caption className='sr-only'>What the Studio plan includes</caption>
      <thead>
        <tr className='hairline-b border-border text-muted-foreground text-xs'>
          <th scope='col' className='pb-3 text-left font-medium'>
            Feature
          </th>
          <th scope='col' className='pb-3 text-right font-medium'>
            In the Studio plan
          </th>
        </tr>
      </thead>
      {FEATURE_GROUPS.map((group) => (
        <tbody key={group.title}>
          <tr>
            <th
              scope='rowgroup'
              colSpan={2}
              className='pt-7 pb-2 text-left text-sm font-medium'
            >
              {group.title}
            </th>
          </tr>
          {group.rows.map((row) => (
            <tr key={row.feature} className='hairline-b border-border'>
              <th scope='row' className='py-3 pe-4 text-left font-normal'>
                {row.feature}
              </th>
              <td className='text-muted-foreground py-3 text-right'>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
