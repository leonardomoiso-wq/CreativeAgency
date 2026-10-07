/** Esegue un'operazione della gestione, mostra l'esito e ricarica i dati. */
export type Run = (
  label: string,
  fn: () => Promise<{ error: unknown } | void>,
) => Promise<void>;

export function Field({
  label,
  name,
  id,
  ...rest
}: {
  label: string;
  name: string;
  id?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} name={name} className="input" {...rest} />
    </div>
  );
}
