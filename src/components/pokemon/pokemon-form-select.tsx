import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function PokemonFormSelect({
  selectedForm,
  setSelectedForm,
  uniqueForms,
  classes,
}: {
  selectedForm: string;
  setSelectedForm: (form: string) => void;
  uniqueForms: string[];
  classes?: string;
}) {
  return (
    <div className={classes}>
      <label className="label-text" htmlFor="form-select">
        Form:
      </label>
      <Select value={selectedForm} onValueChange={setSelectedForm}>
        <SelectTrigger id="form-select" className="min-w-[180px] bg-white">
          <SelectValue placeholder="Select form" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Plain</SelectItem>
          {uniqueForms
            .filter((form) => form !== 'plain' && form.trim() !== '')
            .map((form) => (
              <SelectItem key={form} value={form}>
                {form
                  .split('_')
                  .map((word, idx, arr) =>
                    idx === arr.length - 1 && arr.length > 1
                      ? `(${word.charAt(0).toUpperCase() + word.slice(1)})`
                      : word.charAt(0).toUpperCase() + word.slice(1),
                  )
                  .join(' ')}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
