import { habits, type HabitId } from '../content';

const moments: HabitId[] = ['study', 'bed'];

// "Studying / Before bed" as native radio buttons: Tab to reach, arrow keys to switch.
export function MomentChoice({
  name,
  legend,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  value: HabitId;
  onChange: (m: HabitId) => void;
}) {
  return (
    <fieldset className="choices">
      <legend className="choices__legend">{legend}</legend>
      <div className="choices__row">
        {moments.map((m) => (
          <label key={m} className="choice">
            <input
              type="radio"
              name={name}
              value={m}
              checked={value === m}
              onChange={() => onChange(m)}
              className="visually-hidden"
            />
            <span>{habits[m].moment}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
