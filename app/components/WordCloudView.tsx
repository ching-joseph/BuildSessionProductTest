"use client";

import { useState, useMemo } from "react";

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

interface WordFrequency {
  word: string;
  count: number;
}

interface Props {
  words: WordFrequency[];
  posts: Post[];
}

const WORD_COLORS = [
  "text-orange-500",
  "text-orange-400",
  "text-amber-500",
  "text-red-500",
  "text-rose-500",
  "text-orange-600",
  "text-yellow-600",
];

function pickColor(word: string): string {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash * 31 + word.charCodeAt(i)) & 0xffffffff;
  }
  return WORD_COLORS[Math.abs(hash) % WORD_COLORS.length];
}

function ScoreArrow({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-8">
      <span className="text-orange-500 text-lg leading-none">▲</span>
      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
        {score}
      </span>
    </div>
  );
}

function CommentCard({
  comment,
  postTitle,
}: {
  comment: Comment;
  postTitle: string;
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 p-4 flex gap-3">
      <ScoreArrow score={comment.score} />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            u/{comment.author}
          </span>
          <span>·</span>
          <span className="italic truncate">on: {postTitle}</span>
        </div>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 p-4 flex gap-3">
      <ScoreArrow score={post.score} />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            u/{post.author}
          </span>
          <span>·</span>
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            post
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {post.title}
        </p>
        {post.selftext && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-6">
            {post.selftext}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WordCloudView({ words, posts }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const maxCount = words[0]?.count ?? 1;
  const minCount = words[words.length - 1]?.count ?? 1;

  function fontSize(count: number): string {
    const minPx = 14;
    const maxPx = 56;
    const ratio =
      maxCount === minCount ? 0.5 : (count - minCount) / (maxCount - minCount);
    return `${Math.round(minPx + ratio * (maxPx - minPx))}px`;
  }

  const matchingItems = useMemo(() => {
    if (!selectedWord) return [];
    const lower = selectedWord.toLowerCase();
    const results: Array<{
      type: "post" | "comment";
      key: string;
      element: React.ReactNode;
    }> = [];

    for (const post of posts) {
      const postText = `${post.title} ${post.selftext}`.toLowerCase();
      if (postText.includes(lower)) {
        results.push({
          type: "post",
          key: `post-${post.id}`,
          element: <PostCard key={`post-${post.id}`} post={post} />,
        });
      }
      for (const comment of post.comments) {
        if (comment.body.toLowerCase().includes(lower)) {
          results.push({
            type: "comment",
            key: `comment-${comment.id}`,
            element: (
              <CommentCard
                key={`comment-${comment.id}`}
                comment={comment}
                postTitle={post.title}
              />
            ),
          });
        }
      }
    }

    return results;
  }, [selectedWord, posts]);

  return (
    <div className="flex flex-col gap-10">
      {/* Word Cloud */}
      <div className="flex flex-wrap gap-3 justify-center items-baseline px-4 py-8 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
        {words.map(({ word, count }) => {
          const isSelected = selectedWord === word;
          return (
            <button
              key={word}
              onClick={() => setSelectedWord(isSelected ? null : word)}
              style={{ fontSize: fontSize(count) }}
              className={[
                "font-bold leading-none transition-all hover:opacity-80 cursor-pointer select-none",
                pickColor(word),
                isSelected
                  ? "underline decoration-2 underline-offset-4 opacity-100 scale-105"
                  : "opacity-90",
              ].join(" ")}
              title={`${count} occurrence${count !== 1 ? "s" : ""}`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {selectedWord && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Posts &amp; comments mentioning{" "}
              <span className="text-orange-500">
                &ldquo;{selectedWord}&rdquo;
              </span>
            </h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {matchingItems.length} result
              {matchingItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          {matchingItems.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              No results found.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {matchingItems.map((item) => item.element)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
