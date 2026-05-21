import * as React from "react";
import js_beautify from "js-beautify";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import { Wand2, Minimize2, Copy, Trash2, ArrowUpFromLine, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = ["JavaScript", "TypeScript", "HTML", "CSS", "JSON"];

const LANG_PRISM_MAP: Record<string, string> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  HTML: "markup",
  CSS: "css",
  JSON: "json",
};

function highlight(code: string, language: string): string {
  const lang = LANG_PRISM_MAP[language] || "javascript";
  if (Prism.languages[lang]) {
    return Prism.highlight(code, Prism.languages[lang], lang);
  }
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getStats(text: string) {
  return {
    chars: text.length,
    lines: text ? text.split("\n").length : 0,
  };
}

export default function BeautifyPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [language, setLanguage] = React.useState("JavaScript");
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const [indentSize, setIndentSize] = React.useState("2");
  const [useTabs, setUseTabs] = React.useState(false);
  const { toast } = useToast();

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  const highlightedOutput = React.useMemo(
    () => (output ? highlight(output, language) : ""),
    [output, language]
  );

  const handleBeautify = () => {
    if (!input.trim()) return;
    try {
      const opts = { indent_size: parseInt(indentSize), indent_with_tabs: useTabs };
      let result = "";
      if (language === "JSON") {
        result = JSON.stringify(JSON.parse(input), null, useTabs ? "\t" : parseInt(indentSize));
      } else if (language === "HTML") {
        result = js_beautify.html_beautify(input, opts);
      } else if (language === "CSS") {
        result = js_beautify.css_beautify(input, opts);
      } else {
        result = js_beautify.js_beautify(input, opts);
      }
      setOutput(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error formatting code",
        description: err instanceof Error ? err.message : "Invalid syntax for selected language",
      });
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      let result = "";
      if (language === "JSON") {
        result = JSON.stringify(JSON.parse(input));
      } else if (language === "CSS") {
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*([\{\}\:\;\,])\s*/g, "$1")
          .replace(/;\}/g, "}")
          .trim();
      } else if (language === "HTML") {
        result = input
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/\>\s+\</g, "><")
          .trim();
      } else {
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*/g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*([\{\}\(\)\[\]\:\;\,\.\=\+\-\*\/\%\!\&\<>\?\|])\s*/g, "$1")
          .trim();
      }
      setOutput(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error minifying code",
        description: err instanceof Error ? err.message : "Invalid syntax for selected language",
      });
    }
  };

  const handleClear = () => { setInput(""); setOutput(""); };

  const handleSwap = () => {
    if (output) { setInput(output); setOutput(""); }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard", description: "Output code has been copied." });
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage} data-testid="select-language">
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Button data-testid="button-beautify" variant="default" size="sm" onClick={handleBeautify}>
              <Wand2 className="w-4 h-4 mr-2" /> Beautify
            </Button>
            <Button data-testid="button-minify" variant="secondary" size="sm" onClick={handleMinify}>
              <Minimize2 className="w-4 h-4 mr-2" /> Minify
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="button-clear" variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      {/* Format Options */}
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen} className="border-b border-border bg-muted/20 shrink-0">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full rounded-none justify-between text-xs text-muted-foreground hover:text-foreground h-8 px-4">
            <span className="flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Format Options
            </span>
            {optionsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 py-3 flex gap-8 items-center bg-card text-sm">
          <div className="flex items-center gap-3">
            <Label htmlFor="indent-size" className="text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Indent Size</Label>
            <Select value={indentSize} onValueChange={setIndentSize}>
              <SelectTrigger id="indent-size" className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
                <SelectItem value="8">8 spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="use-tabs" checked={useTabs} onCheckedChange={setUseTabs} />
            <Label htmlFor="use-tabs" className="text-muted-foreground text-xs uppercase tracking-wider">Use Tabs</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Panels */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Input */}
        <div className="flex-1 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input</span>
            <span className="text-xs text-muted-foreground font-mono">{inputStats.lines} lines · {inputStats.chars} chars</span>
          </div>
          <textarea
            data-testid="input-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-h-0 w-full p-4 font-mono text-sm bg-background border-none resize-none focus:outline-none text-foreground leading-relaxed"
            placeholder={`Paste ${language} code here...`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex-1 min-h-0 flex flex-col bg-[hsl(220_17%_6%)]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">{outputStats.lines} lines · {outputStats.chars} chars</span>
              <div className="flex items-center gap-1 border-l border-border pl-2">
                <Button data-testid="button-swap" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleSwap} title="Use as input">
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                </Button>
                <Button data-testid="button-copy" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy output">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {output ? (
              <pre className="p-4 font-mono text-sm leading-relaxed m-0 min-h-full">
                <code
                  className={`language-${LANG_PRISM_MAP[language] || "javascript"}`}
                  dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                />
              </pre>
            ) : (
              <div className="p-4 font-mono text-sm text-muted-foreground/40 select-none">
                Result will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
