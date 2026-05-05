export type Project = {
  id: string;
  name: string;
  language: string;
  type: string;
  lastModified: string;
  status: "running" | "stopped";
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "My Web App",
    language: "React",
    type: "Web App",
    lastModified: "2 hours ago",
    status: "running",
  },
  {
    id: "2",
    name: "Snake Game",
    language: "JavaScript",
    type: "Game",
    lastModified: "1 day ago",
    status: "stopped",
  },
  {
    id: "3",
    name: "REST API",
    language: "Node.js",
    type: "API",
    lastModified: "3 days ago",
    status: "stopped",
  },
  {
    id: "4",
    name: "Dashboard UI",
    language: "React",
    type: "Design",
    lastModified: "1 week ago",
    status: "stopped",
  },
  {
    id: "5",
    name: "ML Model",
    language: "Python",
    type: "Data",
    lastModified: "2 weeks ago",
    status: "running",
  },
  {
    id: "6",
    name: "Mobile App",
    language: "React Native",
    type: "Mobile",
    lastModified: "3 weeks ago",
    status: "stopped",
  },
];

export const MOCK_USER = {
  name: "N",
  username: "@n_builder",
  bio: "Building the future of the web.",
  avatar: "N",
  stats: {
    projects: 42,
    followers: 1337,
    following: 256,
    stars: 89,
  }
};
