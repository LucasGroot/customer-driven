/**
 * Joins CSS module class names, skipping the ones that are switched off. CSS
 * module lookups are typed as possibly undefined, so building the class string
 * by hand here keeps every call site free of that check.
 */
export function classNames(...names: (string | false | undefined)[]): string {
  return names.filter((name) => typeof name === "string" && name !== "").join(" ");
}
