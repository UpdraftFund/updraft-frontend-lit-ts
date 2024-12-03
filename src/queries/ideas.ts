import { client } from "./client";

const ALL_IDEAS_NAMES = `
  query AllIdeasNames {
    ideas {
      name
    }
  }
`;

const IDEAS_FULL_TEXT = `
  query IdeasFullText($text: String!) {
    ideaSearch(text: $text) {
      id,
      name,
      description,
      shares,
      startTime,
      tags
    }
  }
`;

interface Idea {
  id: string;
  name: string;
  description: string;
  shares: number;
  startTime: string;
  tags: string[];
}


export const getAllIdeasNames = async () => {
  const response = await client.query(ALL_IDEAS_NAMES, {}).toPromise();
  // return a list of ideas names
  return response.data.ideas.map((idea: { name: any }) => idea.name);
};

export const ideasFullText = async (text: string) => {
  const response = await client.query(IDEAS_FULL_TEXT, { text }).toPromise();
  // return a list of Ideas
  return response.data.ideaSearch.map((idea: Idea) => ({
    id: idea.id,
    name: idea.name,
    description: idea.description,
    shares: idea.shares,
    startTime: idea.startTime,
    tags: idea.tags
  }));
};

