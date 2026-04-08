import fs from "fs";
import path from "path";

const SUBREDDIT = process.argv[2] ?? "programming";
const USER_AGENT = "reddit-wordcloud-script/1.0 (by /u/wordcloud-demo)";
const DELAY_MS = 1000;

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  author: string;
  score: number;
  permalink: string;
}

interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
}

interface ParsedPost extends RedditPost {
  comments: RedditComment[];
}

interface ParsedData {
  subreddit: string;
  fetchedAt: string;
  posts: ParsedPost[];
}

async function redditFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return res.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTopPosts(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=10&t=week`;
  console.log(`Fetching top posts from ${url}`);
  const data = (await redditFetch(url)) as {
    data: { children: Array<{ data: RedditPost }> };
  };
  return data.data.children.map((child) => ({
    id: child.data.id,
    title: child.data.title,
    selftext: child.data.selftext,
    url: child.data.url,
    author: child.data.author,
    score: child.data.score,
    permalink: child.data.permalink,
  }));
}

async function fetchTopComments(
  subreddit: string,
  postId: string,
): Promise<RedditComment[]> {
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=25&sort=top`;
  const data = (await redditFetch(url)) as Array<{
    data: { children: Array<{ kind: string; data: RedditComment }> };
  }>;
  // data[1] is the comments listing
  const commentListing = data[1];
  return commentListing.data.children
    .filter((child) => child.kind === "t1")
    .slice(0, 25)
    .map((child) => ({
      id: child.data.id,
      body: child.data.body,
      author: child.data.author,
      score: child.data.score,
    }));
}

async function main() {
  console.log(`Parsing r/${SUBREDDIT}...`);

  const posts = await fetchTopPosts(SUBREDDIT);
  console.log(`Found ${posts.length} top posts`);

  const parsedPosts: ParsedPost[] = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(
      `  [${i + 1}/${posts.length}] Fetching comments for: ${post.title.slice(0, 60)}...`,
    );

    await sleep(DELAY_MS);

    const comments = await fetchTopComments(SUBREDDIT, post.id);
    console.log(`    Got ${comments.length} comments`);

    parsedPosts.push({ ...post, comments });
  }

  const output: ParsedData = {
    subreddit: SUBREDDIT,
    fetchedAt: new Date().toISOString(),
    posts: parsedPosts,
  };

  const outDir = path.join(process.cwd(), "tmp-data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "parsed.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nSaved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
