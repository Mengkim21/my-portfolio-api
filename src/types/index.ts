export interface Tag {
  id?: number;
  name: string;
  color_hex?: string;
}

export interface Project {
  id?: number;
  title: string;
  slug: string;
  summary: string;
  description_markdown: string;
  image_url?: string;
  github_url?: string;
  live_url?: string;
  is_featured: boolean;
  tags?: number[];
}