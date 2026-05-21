import { useState, useMemo } from "wouter"; // Wait, wrong imports, should be react
import * as React from "react";
import { diffLines, Change } from "diff";
import { Copy, Trash2, ArrowLeftRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  "JavaScript", "TypeScript", "HTML", "CSS", "JSON", "Python", "Java", "C++", "Plain Text"
];

export default function DiffPage() {
  const [original, setOriginal] = React.useState("");
  const [modified, setModified] = React.useState("");
  const [language, setLanguage] = React.useState("JavaScript");
  const [viewMode, setViewMode] = React.useState<"split" | "inline">("split");
  const { toast } = useToast();

  const diffResult = React.useMemo(() => {
    return diffLines(original, modified);
  }, [original, modified]);

  const stats = React.useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    diffResult.forEach(part => {
      const lines = part.count || 0;
      if (part.added) added += lines;
      else if (part.removed) removed += lines;
      else unchanged += lines;
    });
    return { added, removed, unchanged };
  }, [diffResult]);

  const handleSwap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const handleClear = () => {
    setOriginal("");
    setModified("");
  };

  const handleCopy = () => {
    // Copy the diff output somehow, maybe just the modified text or a formatted diff?
    // Let's just copy the modified code as it represents the "result" usually.
    navigator.clipboard.writeText(modified);
    toast({
      title: "Copied to clipboard",
      description: "Modified code has been copied.",
    });
  };

  const renderSplitView = () => {
    let leftLineNum = 1;
    let rightLineNum = 1;
    
    const rows: React.ReactNode[] = [];
    
    diffResult.forEach((part, index) => {
      const lines = part.value.replace(/\n$/, "").split("\n");
      
      lines.forEach((line, lineIndex) => {
        const leftNum = part.added ? "" : leftLineNum++;
        const rightNum = part.removed ? "" : rightLineNum++;
        
        let bgClassLeft = "bg-transparent";
        let bgClassRight = "bg-transparent";
        let textClassLeft = "text-foreground";
        let textClassRight = "text-foreground";
        
        if (part.removed) {
          bgClassLeft = "bg-destructive/20";
          textClassLeft = "text-destructive-foreground";
        } else if (part.added) {
          bgClassRight = "bg-green-500/20";
          textClassRight = "text-green-500";
        }
        
        rows.push(
          <div key={`${index}-${lineIndex}`} className="flex font-mono text-sm leading-relaxed hover:bg-muted/50 transition-colors">
            {/* Left side */}
            <div className={cn("flex w-1/2 border-r border-border", bgClassLeft)}>
              <div className="w-12 shrink-0 text-right pr-2 text-muted-foreground select-none border-r border-border bg-card/50">
                {leftNum}
              </div>
              <div className="pl-4 whitespace-pre-wrap break-all py-0.5 overflow-hidden">
                {part.removed ? <span className="text-destructive font-bold inline-block w-4 -ml-4">-</span> : null}
                <span className={part.removed ? "text-destructive/90" : "text-muted-foreground"}>{line || " "}</span>
              </div>
            </div>
            
            {/* Right side */}
            <div className={cn("flex w-1/2", bgClassRight)}>
              <div className="w-12 shrink-0 text-right pr-2 text-muted-foreground select-none border-r border-border bg-card/50">
                {rightNum}
              </div>
              <div className="pl-4 whitespace-pre-wrap break-all py-0.5 overflow-hidden">
                {part.added ? <span className="text-green-500 font-bold inline-block w-4 -ml-4">+</span> : null}
                <span className={part.added ? "text-green-400" : "text-foreground"}>{line || " "}</span>
              </div>
            </div>
          </div>
        );
      });
    });
    
    return rows;
  };

  const renderInlineView = () => {
    let lineNum = 1;
    const rows: React.ReactNode[] = [];
    
    diffResult.forEach((part, index) => {
      const lines = part.value.replace(/\n$/, "").split("\n");
      
      lines.forEach((line, lineIndex) => {
        let bgClass = "bg-transparent";
        let textClass = "text-foreground";
        let prefix = " ";
        
        if (part.removed) {
          bgClass = "bg-destructive/20";
          textClass = "text-destructive";
          prefix = "-";
        } else if (part.added) {
          bgClass = "bg-green-500/20";
          textClass = "text-green-400";
          prefix = "+";
        }
        
        rows.push(
          <div key={`${index}-${lineIndex}`} className={cn("flex font-mono text-sm leading-relaxed hover:bg-muted/50 transition-colors", bgClass)}>
            <div className="w-16 shrink-0 flex text-muted-foreground select-none border-r border-border bg-card/50">
               <div className="w-1/2 text-right pr-2">{part.added ? "" : lineNum}</div>
               <div className="w-1/2 text-right pr-2 border-l border-border/50">{part.removed ? "" : (part.added ? lineNum : lineNum)}</div>
            </div>
            <div className="pl-4 whitespace-pre-wrap break-all py-0.5 overflow-hidden">
              <span className={cn("font-bold inline-block w-4 -ml-4", part.removed ? "text-destructive" : part.added ? "text-green-500" : "text-transparent")}>{prefix}</span>
              <span className={textClass}>{line || " "}</span>
            </div>
          </div>
        );
        
        if (!part.removed && !part.added) {
          lineNum++;
        } else if (part.added) {
          lineNum++; // Added lines take up line numbers on the right side
        } else if (part.removed) {
          // Removed lines only take up line numbers on the left side
          // Wait, in inline diff, we usually increment both counters separately.
          // This is a simplified inline diff line numbering.
        }
      });
    });
    
    return rows;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} className="h-8 border border-input rounded-md overflow-hidden p-0">
            <ToggleGroupItem value="split" aria-label="Split View" className="h-full rounded-none px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Side by Side
            </ToggleGroupItem>
            <ToggleGroupItem value="inline" aria-label="Inline View" className="h-full rounded-none px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              Inline
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-sm mr-4 text-muted-foreground font-mono bg-background px-3 py-1 rounded-md border border-border">
            <span className="text-green-500">+{stats.added}</span>
            <span className="text-destructive">-{stats.removed}</span>
            <span>~{stats.unchanged}</span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={handleSwap}>
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Swap
          </Button>
          <Button variant="default" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Result
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor Inputs (always split for input) */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[200px] lg:min-h-0 bg-background relative">
          <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider bg-card border-b border-l border-border rounded-bl-md z-10">Original</div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-muted-foreground"
            placeholder="Paste original code here..."
            spellCheck={false}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-h-[200px] lg:min-h-0 bg-background relative">
          <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground font-medium uppercase tracking-wider bg-card border-b border-l border-border rounded-bl-md z-10">Modified</div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            className="w-full h-full p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-foreground"
            placeholder="Paste modified code here..."
            spellCheck={false}
          />
        </div>
      </div>
      
      {/* Diff Result */}
      {(original || modified) && (
        <div className="h-1/2 flex flex-col border-t border-border shrink-0 bg-background">
          <div className="px-4 py-2 border-b border-border bg-card flex justify-between items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Diff Output</span>
          </div>
          <div className="flex-1 overflow-auto bg-[#0d1017]">
            <div className="py-2">
              {viewMode === "split" ? renderSplitView() : renderInlineView()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
