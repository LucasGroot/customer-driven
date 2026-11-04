import { createContext } from "react";
import type { AboutTopic } from "../domain/aboutTopics";

/** Opens "Om analysen" at one question. Null where there is no such page to open. */
export const OpenAboutContext = createContext<((topic: AboutTopic) => void) | null>(null);
