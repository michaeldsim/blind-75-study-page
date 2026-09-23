"use client";

import Link from "next/link";
import { RefObject } from "react";
import { LIST_LABELS, type ListId } from "@/lib/catalog";
import { BarChart, Moon, Search, Settings, Sun } from "./icons";

interface Props {
  list: ListId;
  onListChange: (l: ListId) => void;
  counts: Record<ListId, { solved: number; total: number }>;
  query: string;
  onQueryChange: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onThemeToggle: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  signedIn: boolean;
}

export default function TopBar({
  list, onListChange, counts, query, onQueryChange, searchRef,
  onThemeToggle, onOpenStats, onOpenSettings, signedIn,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">G</span>
        <span>Grind</span>
      </div>

      <div className="segmented" role="group" aria-label="Problem list">
        {(Object.keys(LIST_LABELS) as ListId[]).map((id) => (
          <button
            key={id}
            aria-pressed={list === id}
            onClick={() => onListChange(id)}
          >
            {LIST_LABELS[id]}
            <span className="seg-count mono">
              {counts[id].solved}/{counts[id].total}
            </span>
          </button>
        ))}
      </div>

      <div className="search">
        <span className="search-icon"><Search /></span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          placeholder="Search problems…"
          aria-label="Search problems"
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query === "" && <span className="search-kbd"><kbd>/</kbd></span>}
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-actions">
        {!signedIn && (
          <Link className="btn btn-primary" href="/login">
            Sign in
          </Link>
        )}
        <button className="icon-btn" onClick={onOpenStats} aria-label="Statistics" title="Statistics (S)">
          <BarChart />
        </button>
        <button
          className="icon-btn"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          title="Toggle theme (T)"
        >
          {/* Both render; CSS shows whichever matches the active theme.
              Deciding in JS meant branching on `window` during render, which
              made the server and client disagree. */}
          <span className="icon-when-dark"><Sun /></span>
          <span className="icon-when-light"><Moon /></span>
        </button>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings" title="Settings">
          <Settings />
        </button>
      </div>
    </header>
  );
}
