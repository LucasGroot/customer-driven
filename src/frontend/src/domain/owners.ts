import { UNASSIGNED_OWNER } from "./labels";

/**
 * The people a routine can be given to: the signed-in user first, then everyone
 * the snapshot lists. "Ikke tildelt" is no owner, so it is never offered.
 */
export function ownerCandidates(snapshotOwners: string[], currentUserName: string): string[] {
  const defaultOwners = ["Kari Nordmann", "Ola Nordmann"];
  const others = snapshotOwners.filter((owner) => owner !== UNASSIGNED_OWNER && owner !== currentUserName);
  const allOthers = [...new Set([...others, ...defaultOwners])];
  return [currentUserName, ...allOthers];
}
