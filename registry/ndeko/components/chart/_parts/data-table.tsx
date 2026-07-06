export type DataRow = {
  id: string;
  /** The heading of the row: a day, a category, a step. */
  label: string;
  cells: readonly string[];
};

type DataTableProps = {
  caption: string;
  /** The heading of the label column first, then one per cell. */
  columns: readonly string[];
  rows: readonly DataRow[];
};

/**
 * The numbers a chart draws, as a table for screen readers. It is taken out of the flow, so the
 * piece it sits in has to be positioned: a hidden box inside an area that scrolls sideways widens
 * the page otherwise.
 */
export function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <table className='sr-only'>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope='col'>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <th scope='row'>{row.label}</th>
            {row.cells.map((cell, index) => (
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
