import * as React from "react";
import { diffTrimmedLines, diffWords } from "diff";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import { Copy, Trash2, ArrowLeftRight, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  "JavaScript", "TypeScript", "HTML", "CSS", "JSON",
  "Python", "Java", "Plain Text",
];

const LANG_PRISM_MAP: Record<string, string> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  HTML: "markup",
  CSS: "css",
  JSON: "json",
  Python: "python",
  Java: "java",
  "Plain Text": "",
};

const EXT_MAP: Record<string, string> = {
  JavaScript: "js", TypeScript: "ts", HTML: "html", CSS: "css",
  JSON: "json", Python: "py", Java: "java", "Plain Text": "txt",
};

function highlightLine(line: string, language: string): string {
  const lang = LANG_PRISM_MAP[language] || "";
  if (lang && Prism.languages[lang]) {
    return Prism.highlight(line, Prism.languages[lang], lang);
  }
  return line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildUnifiedDiff(original: string, modified: string): string {
  const result = diffTrimmedLines(original, modified);
  const lines: string[] = ["--- original", "+++ modified"];
  result.forEach((part) => {
    const prefix = part.added ? "+" : part.removed ? "-" : " ";
    part.value.replace(/\n$/, "").split("\n").forEach((l) => lines.push(prefix + l));
  });
  return lines.join("\n");
}

/** Build a word-level explanation of the diff between two blocks of text */
function explainChange(removedText: string, addedText: string): string {
  if (!removedText.trim() && !addedText.trim()) return "";
  if (!addedText.trim()) return `This line was deleted.`;
  if (!removedText.trim()) return `This line was added.`;

  const wordDiff = diffWords(removedText.trim(), addedText.trim());
  const removed: string[] = [];
  const added: string[] = [];
  wordDiff.forEach((part) => {
    if (part.removed) removed.push(`"${part.value.trim()}"`);
    if (part.added) added.push(`"${part.value.trim()}"`);
  });

  const parts: string[] = [];
  if (removed.length) parts.push(`Removed: ${removed.join(", ")}`);
  if (added.length) parts.push(`Added: ${added.join(", ")}`);
  return parts.join("  →  ") || "Content changed.";
}

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

/** Pre-compute tooltips for every diff row, keyed by "partIdx-lineIdx" */
function buildTooltipMap(diff: ReturnType<typeof diffTrimmedLines>): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < diff.length; i++) {
    const cur = diff[i];
    if (cur.removed) {
      const next = diff[i + 1];
      const removedLines = cur.value.replace(/\n$/, "").split("\n");
      const addedLines = next?.added ? next.value.replace(/\n$/, "").split("\n") : [];
      removedLines.forEach((line, li) => {
        const counterpart = addedLines[li] ?? "";
        map.set(`${i}-${li}`, explainChange(line, counterpart));
      });
    } else if (cur.added) {
      const prev = diff[i - 1];
      const addedLines = cur.value.replace(/\n$/, "").split("\n");
      const removedLines = prev?.removed ? prev.value.replace(/\n$/, "").split("\n") : [];
      addedLines.forEach((line, li) => {
        const counterpart = removedLines[li] ?? "";
        map.set(`${i}-${li}`, explainChange(counterpart, line));
      });
    }
  }
  return map;
}

export default function DiffPage() {
  const [original, setOriginal] = React.useState("");
  const [modified, setModified] = React.useState("");
  const [language, setLanguage] = React.useState("JavaScript");
  const [viewMode, setViewMode] = React.useState<"split" | "inline">("split");
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const { toast } = useToast();

  const diffResult = React.useMemo(() => diffTrimmedLines(original, modified), [original, modified]);
  const tooltipMap = React.useMemo(() => buildTooltipMap(diffResult), [diffResult]);

  const stats = React.useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    diffResult.forEach((part) => {
      const lines = part.count || 0;
      if (part.added) added += lines;
      else if (part.removed) removed += lines;
      else unchanged += lines;
    });
    return { added, removed, unchanged };
  }, [diffResult]);

  const handleSwap = () => { setOriginal(modified); setModified(original); };
  const handleClear = () => { setOriginal(""); setModified(""); };

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(original);
    toast({ title: "Copied", description: "Original copied." });
  };
  const handleCopyModified = () => {
    navigator.clipboard.writeText(modified);
    toast({ title: "Copied", description: "Modified copied." });
  };
  const handleCopyDiff = () => {
    navigator.clipboard.writeText(buildUnifiedDiff(original, modified));
    toast({ title: "Copied", description: "Unified diff copied." });
  };
  const handleDownloadDiff = () => {
    const ext = EXT_MAP[language] || "txt";
    downloadText(buildUnifiedDiff(original, modified), `diff.${ext}.diff`);
    toast({ title: "Downloaded" });
  };
  const handleDownloadModified = () => {
    const ext = EXT_MAP[language] || "txt";
    downloadText(modified, `modified.${ext}`);
    toast({ title: "Downloaded" });
  };

  const hasDiff = original.length > 0 || modified.length > 0;

  const showTooltip = (e: React.MouseEvent, key: string) => {
    const text = tooltipMap.get(key);
    if (!text) return;
    setTooltip({ x: e.clientX, y: e.clientY - 8, text });
  };
  const hideTooltip = () => setTooltip(null);

  const renderSplitView = () => {
    let leftLineNum = 1;
    let rightLineNum = 1;
    const rows: React.ReactNode[] = [];

    diffResult.forEach((part, index) => {
      const rawLines = part.value.replace(/\n$/, "").split("\n");
      rawLines.forEach((line, lineIndex) => {
        const key = `${index}-${lineIndex}`;
        const leftNum = part.added ? null : leftLineNum++;
        const rightNum = part.removed ? null : rightLineNum++;
        const isRemoved = !!part.removed;
        const isAdded = !!part.added;

        rows.push(
          <div
            key={key}
            className={cn(
              "flex font-mono text-xs leading-5 min-w-0",
              (isRemoved || isAdded) && "cursor-help"
            )}
            onMouseMove={isRemoved || isAdded ? (e) => showTooltip(e, key) : undefined}
            onMouseLeave={isRemoved || isAdded ? hideTooltip : undefined}
          >
            {/* Left */}
            <div className={cn("flex w-1/2 border-r border-border min-w-0", isRemoved && "bg-red-500/10 dark:bg-red-950/40")}>
              <div className={cn(
                "w-10 shrink-0 text-right pr-2 select-none border-r py-0.5 text-xs",
                isRemoved
                  ? "border-red-400/30 bg-red-500/15 text-red-600 dark:text-red-400/70"
                  : "border-border bg-card/30 text-muted-foreground/60"
              )}>
                {leftNum ?? ""}
              </div>
              <div className="pl-3 pr-2 py-0.5 whitespace-pre-wrap break-words overflow-hidden flex-1 min-w-0">
                {isRemoved && <span className="text-red-500 dark:text-red-400 mr-1 select-none font-bold">-</span>}
                <span
                  className={isRemoved ? "text-red-700 dark:text-red-300" : "text-foreground/80"}
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || "&nbsp;" }}
                />
              </div>
            </div>
            {/* Right */}
            <div className={cn("flex w-1/2 min-w-0", isAdded && "bg-green-500/10 dark:bg-green-950/40")}>
              <div className={cn(
                "w-10 shrink-0 text-right pr-2 select-none border-r py-0.5 text-xs",
                isAdded
                  ? "border-green-400/30 bg-green-500/15 text-green-600 dark:text-green-400/70"
                  : "border-border bg-card/30 text-muted-foreground/60"
              )}>
                {rightNum ?? ""}
              </div>
              <div className="pl-3 pr-2 py-0.5 whitespace-pre-wrap break-words overflow-hidden flex-1 min-w-0">
                {isAdded && <span className="text-green-500 dark:text-green-400 mr-1 select-none font-bold">+</span>}
                <span
                  className={isAdded ? "text-green-700 dark:text-green-300" : "text-foreground/80"}
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || "&nbsp;" }}
                />
              </div>
            </div>
          </div>
        );
      });
    });
    return rows;
  };

  const renderInlineView = () => {
    let leftLine = 1;
    let rightLine = 1;
    const rows: React.ReactNode[] = [];

    diffResult.forEach((part, index) => {
      const rawLines = part.value.replace(/\n$/, "").split("\n");
      rawLines.forEach((line, lineIndex) => {
        const key = `${index}-${lineIndex}`;
        const isRemoved = !!part.removed;
        const isAdded = !!part.added;
        const lNum = isAdded ? "" : leftLine;
        const rNum = isRemoved ? "" : rightLine;
        if (!isAdded) leftLine++;
        if (!isRemoved) rightLine++;

        rows.push(
          <div
            key={key}
            className={cn(
              "flex font-mono text-xs leading-5 min-w-0",
              isRemoved ? "bg-red-500/10 dark:bg-red-950/40"
                : isAdded ? "bg-green-500/10 dark:bg-green-950/40" : "",
              (isRemoved || isAdded) && "cursor-help"
            )}
            onMouseMove={isRemoved || isAdded ? (e) => showTooltip(e, key) : undefined}
            onMouseLeave={isRemoved || isAdded ? hideTooltip : undefined}
          >
            <div className={cn(
              "w-10 shrink-0 text-right pr-2 select-none border-r py-0.5 text-xs",
              isRemoved ? "border-red-400/30 bg-red-500/15 text-red-600 dark:text-red-400/70"
                : isAdded ? "border-green-400/30 bg-green-500/15 text-green-600 dark:text-green-400/70"
                : "border-border bg-card/30 text-muted-foreground/60"
            )}>{lNum}</div>
            <div className={cn(
              "w-10 shrink-0 text-right pr-2 select-none border-r py-0.5 text-xs",
              isRemoved ? "border-red-400/30 bg-red-500/15 text-red-600 dark:text-red-400/70"
                : isAdded ? "border-green-400/30 bg-green-500/15 text-green-600 dark:text-green-400/70"
                : "border-border bg-card/30 text-muted-foreground/60"
            )}>{rNum}</div>
            <div className="pl-3 pr-2 py-0.5 whitespace-pre-wrap break-words overflow-hidden flex-1 min-w-0">
              <span className={cn(
                "mr-1 select-none font-bold",
                isRemoved ? "text-red-500 dark:text-red-400"
                  : isAdded ? "text-green-500 dark:text-green-400"
                  : "text-transparent"
              )}>{isRemoved ? "-" : isAdded ? "+" : " "}</span>
              <span
                className={
                  isRemoved ? "text-red-700 dark:text-red-300"
                    : isAdded ? "text-green-700 dark:text-green-300"
                    : "text-foreground/80"
                }
                dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || "&nbsp;" }}
              />
            </div>
          </div>
        );
      });
    });
    return rows;
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage} data-testid="select-language">
            <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border border-input overflow-hidden h-8">
            <button
              onClick={() => setViewMode("split")}
              className={cn(
                "px-3 h-full text-xs font-medium transition-colors",
                viewMode === "split" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid="button-split-view"
            >Side by Side</button>
            <button
              onClick={() => setViewMode("inline")}
              className={cn(
                "px-3 h-full text-xs font-medium transition-colors border-l border-input",
                viewMode === "inline" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid="button-inline-view"
            >Inline</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDiff && (
            <div className="flex items-center gap-2 text-xs font-mono bg-background px-3 py-1 rounded-md border border-border">
              <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
              <span className="text-red-600 dark:text-red-400">-{stats.removed}</span>
              <span className="text-muted-foreground">~{stats.unchanged}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleClear}><Trash2 className="w-4 h-4 mr-1.5" />Clear</Button>
          <Button variant="outline" size="sm" onClick={handleSwap}><ArrowLeftRight className="w-4 h-4 mr-1.5" />Swap</Button>
          <Button variant="outline" size="sm" onClick={handleCopyModified} disabled={!modified}><Copy className="w-4 h-4 mr-1.5" />Copy</Button>
          <Button variant="outline" size="sm" onClick={handleDownloadDiff} disabled={!hasDiff}><Download className="w-4 h-4 mr-1.5" />Download</Button>
        </div>
      </div>

      {/* Input panels */}
      <div className="flex shrink-0 border-b border-border" style={{ height: "35%" }}>
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-mono mr-1">{original ? original.split("\n").length : 0} lines</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={handleCopyOriginal} disabled={!original} title="Copy original">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <textarea
            data-testid="input-original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="flex-1 min-h-0 w-full p-3 font-mono text-sm bg-background border-none resize-none focus:outline-none text-foreground leading-relaxed"
            placeholder="Paste original code here..."
            spellCheck={false}
          />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modified</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-mono mr-1">{modified ? modified.split("\n").length : 0} lines</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={handleCopyModified} disabled={!modified} title="Copy modified">
                <Copy className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={handleDownloadModified} disabled={!modified} title="Download modified">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <textarea
            data-testid="input-modified"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            className="flex-1 min-h-0 w-full p-3 font-mono text-sm bg-background border-none resize-none focus:outline-none text-foreground leading-relaxed"
            placeholder="Paste modified code here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff output */}
      <div className="flex-1 min-h-0 flex flex-col" style={{ background: "var(--code-bg)" }}>
        <div className="px-4 py-1.5 border-b border-border bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Diff Output
            {hasDiff && <span className="ml-2 font-normal normal-case text-muted-foreground/60">— hover highlighted lines to see what changed</span>}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleCopyDiff} disabled={!hasDiff} title="Copy unified diff">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleDownloadDiff} disabled={!hasDiff} title="Download diff">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto relative">
          {hasDiff ? (
            <div className="py-1">
              {viewMode === "split" ? renderSplitView() : renderInlineView()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm font-mono select-none">
              Paste code in both panels above to see the diff
            </div>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none max-w-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
        >
          <div className="bg-popover border border-border rounded-md shadow-lg px-3 py-2 text-xs font-mono text-popover-foreground leading-relaxed whitespace-pre-wrap">
            <div className="flex items-start justify-between gap-2">
              <span>{tooltip.text}</span>
            </div>
          </div>
          <div className="w-2 h-2 bg-popover border-b border-r border-border rotate-45 ml-3 -mt-1" />
        </div>
      )}
    </div>
  );
}
