import type { SortKey } from '../types';

interface SortControlProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <label className="field field--compact">
      <span>Sort by</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SortKey)}>
        <option value="projection">Projection</option>
        <option value="actionability">Actionability</option>
        <option value="trustworthiness">Trustworthiness</option>
        <option value="edge">Market edge</option>
      </select>
    </label>
  );
}
