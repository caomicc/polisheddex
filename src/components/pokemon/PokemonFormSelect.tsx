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
      <label className="leading-none text-xs" htmlFor="form-select">
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
                {form.charAt(0).toUpperCase() + form.slice(1)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
