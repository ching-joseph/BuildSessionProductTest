import fs from "fs";
import path from "path";
import WordCloudView from "@/app/components/WordCloudView";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "its",
  "be",
  "as",
  "this",
  "that",
  "was",
  "are",
  "were",
  "been",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "can",
  "not",
  "no",
  "nor",
  "so",
  "yet",
  "both",
  "either",
  "neither",
  "just",
  "than",
  "then",
  "there",
  "their",
  "they",
  "them",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "when",
  "where",
  "why",
  "how",
  "all",
  "any",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "i",
  "my",
  "me",
  "we",
  "our",
  "you",
  "your",
  "he",
  "his",
  "she",
  "her",
  "if",
  "up",
  "out",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "each",
  "because",
  "while",
  "re",
  "s",
  "t",
  "ve",
  "ll",
  "d",
  "m",
  "isn",
  "aren",
  "wasn",
  "didn",
  "don",
  "doesn",
  "won",
  "can",
  "get",
  "got",
  "like",
  "also",
  "now",
  "even",
  "back",
  "go",
  "still",
  "way",
  "think",
  "know",
  "see",
  "make",
  "want",
  "use",
  "need",
  "one",
  "two",
  "many",
  "much",
  "very",
  "really",
  "pretty",
  "quite",
  "actually",
  "basically",
  "literally",
  "going",
  "being",
  "having",
  "getting",
  "new",
  "good",
  "great",
  "big",
  "own",
  "same",
  "r",
  "com",
  "www",
  "https",
  "http",
]);

interface Comment {
  id: string;
  body: string;
  author: string;
  score: number;
}

interface Post {
  id: string;
  title: string;
  selftext: string;
  url: string;
  author: string;
  score: number;
  permalink: string;
  comments: Comment[];
}

interface ParsedData {
  subreddit: string;
  fetchedAt: string;
  posts: Post[];
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

function buildWordFrequencies(
  data: ParsedData,
): Array<{ word: string; count: number }> {
  const freq: Record<string, number> = {};

  for (const post of data.posts) {
    for (const word of extractWords(post.title)) {
      freq[word] = (freq[word] ?? 0) + 1;
    }
    if (post.selftext) {
      for (const word of extractWords(post.selftext)) {
        freq[word] = (freq[word] ?? 0) + 1;
      }
    }
    for (const comment of post.comments) {
      if (comment.body && comment.body !== "[deleted]") {
        for (const word of extractWords(comment.body)) {
          freq[word] = (freq[word] ?? 0) + 1;
        }
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([word, count]) => ({ word, count }));
}

export default function Home() {
  const dataPath = path.join(process.cwd(), "tmp-data", "parsed.json");
  const fileExists = fs.existsSync(dataPath);

  if (!fileExists) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans">
        <div className="flex flex-col items-center gap-4 text-center px-8">
          <span className="text-5xl">📭</span>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            No data yet
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-md">
            npm run parse -- &lt;subreddit&gt;
          </p>
        </div>
      </div>
    );
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const data: ParsedData = JSON.parse(raw);
  const words = buildWordFrequencies(data);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            r/{data.subreddit}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data.posts.length} posts ·{" "}
            {data.posts.reduce((n, p) => n + p.comments.length, 0)} comments ·
            fetched {new Date(data.fetchedAt).toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-4">
          Click a word to see matching posts and comments.
        </p>
        <WordCloudView words={words} posts={data.posts} />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
