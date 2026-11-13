import { describe, expect, it } from "vitest";
import { ABOUT_TOPICS } from "../../domain/aboutTopics";
import { DEFAULT_WEIGHTS } from "../../domain/priority";
import { FAQ_SECTIONS } from "./aboutContent";

describe("the FAQ on Om analysen", () => {
  const topicsOnPage = FAQ_SECTIONS.flatMap((section) => section.questions.map((item) => item.topic));

  it("has exactly one question for every topic other pages link to", () => {
    expect([...topicsOnPage].sort()).toEqual([...ABOUT_TOPICS].sort());
  });

  it("says the priority factors count equally only while their weights are equal", () => {
    expect(DEFAULT_WEIGHTS.volume).toBe(DEFAULT_WEIGHTS.coverage);
  });
});
