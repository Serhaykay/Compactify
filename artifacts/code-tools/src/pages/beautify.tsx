import * as React from "react";
import js_beautify from "js-beautify";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import {
  Wand2, Minimize2, Copy, Trash2, ArrowLeft, Download, Settings2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const EXT_MAP: Record<string, string> = {
  JavaScript: "js", TypeScript: "ts", HTML: "html", CSS: "css", JSON: "json",
};

function highlightCode(code: string, language: string): string {
  const lang = LANG_PRISM_MAP[language] || "javascript";
  if (Prism.languages[lang]) {
    return Prism.highlight(code, Prism.languages[lang], lang);
  }
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getStats(text: string) {
  return { chars: text.length, lines: text ? text.split("\n").length : 0 };
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

interface BoolOpt {
  key: string;
  label: string;
  langs?: string[];
}

const BOOL_OPTIONS: BoolOpt[] = [
  { key: "end_with_newline",         label: "End with newline" },
  { key: "indent_empty_lines",       label: "Keep indentation on empty lines" },
  { key: "e4x",                      label: "E4X / JSX syntax",               langs: ["JavaScript","TypeScript"] },
  { key: "comma_first",              label: "Comma-first list style",          langs: ["JavaScript","TypeScript"] },
  { key: "keep_array_indentation",   label: "Keep array indentation",          langs: ["JavaScript","TypeScript"] },
  { key: "break_chained_methods",    label: "Break chained methods",           langs: ["JavaScript","TypeScript"] },
  { key: "space_before_conditional", label: 'Space before "if (x)"',           langs: ["JavaScript","TypeScript"] },
  { key: "unescape_strings",         label: "Unescape \\xNN / \\uNNNN",        langs: ["JavaScript","TypeScript"] },
  { key: "jslint_happy",             label: "JSLint-happy tweaks",             langs: ["JavaScript","TypeScript"] },
  { key: "detect_packers",           label: "Detect packers (unsafe)",         langs: ["JavaScript","TypeScript"] },
  { key: "indent_inner_html",        label: "Indent <head> / <body>",          langs: ["HTML"] },
];

type BoolFlags = Record<string, boolean>;

const DEFAULT_FLAGS: BoolFlags = {
  end_with_newline: false,
  indent_empty_lines: false,
  e4x: false,
  comma_first: false,
  keep_array_indentation: false,
  break_chained_methods: false,
  space_before_conditional: true,
  unescape_strings: false,
  jslint_happy: false,
  detect_packers: false,
  indent_inner_html: false,
};

function computeBeautify(
  input: string,
  language: string,
  indentSize: string,
  useTabs: boolean,
  wrapLength: string,
  braceStyle: string,
  flags: BoolFlags
): { result: string; error?: string } {
  try {
    const opts: js_beautify.JSBeautifyOptions = {
      indent_size: parseInt(indentSize),
      indent_with_tabs: useTabs,
      wrap_line_length: parseInt(wrapLength) || 0,
      brace_style: braceStyle as any,
      end_with_newline: flags.end_with_newline,
      indent_empty_lines: flags.indent_empty_lines,
      e4x: flags.e4x,
      comma_first: flags.comma_first,
      keep_array_indentation: flags.keep_array_indentation,
      break_chained_methods: flags.break_chained_methods,
      space_before_conditional: flags.space_before_conditional,
      unescape_strings: flags.unescape_strings,
      jslint_happy: flags.jslint_happy,
      indent_inner_html: flags.indent_inner_html,
    };
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
    return { result };
  } catch (err) {
    return { result: "", error: err instanceof Error ? err.message : "Parse error" };
  }
}

function computeMinify(input: string, language: string): { result: string; error?: string } {
  try {
    let result = "";
    if (language === "JSON") {
      result = JSON.stringify(JSON.parse(input));
    } else if (language === "CSS") {
      result = input
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("")
        .replace(/\s*([{};:,>~+])\s*/g, "$1")
        .replace(/;\}/g, "}")
        .trim();
    } else if (language === "HTML") {
      result = input
        .replace(/<!--(?!\[if)[\s\S]*?-->/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("")
        .replace(/>\s+</g, "><")
        .trim();
    } else {
      // JS / TS — safe approach: strip comments, trim lines, collapse
      result = input
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s*([{};,()\[\]])\s*/g, "$1")
        .replace(/\s*([=!<>+\-*/%&|?:]+)\s*/g, " $1 ")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    if (!result.trim()) return { result: "", error: "Output is empty — check your input" };
    return { result };
  } catch (err) {
    return { result: "", error: err instanceof Error ? err.message : "Parse error" };
  }
}

export default function BeautifyPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"input" | "output">("input");
  const [language, setLanguage] = React.useState("JavaScript");
  const [optionsOpen, setOptionsOpen] = React.useState(true);
  const [lastOp, setLastOp] = React.useState<"beautify" | "minify">("beautify");

  const [indentSize, setIndentSize] = React.useState("4");
  const [useTabs, setUseTabs] = React.useState(false);
  const [wrapLength, setWrapLength] = React.useState("80");
  const [braceStyle, setBraceStyle] = React.useState("collapse");
  const [flags, setFlags] = React.useState<BoolFlags>(DEFAULT_FLAGS);

  const { toast } = useToast();
  const optsRef = React.useRef({ indentSize, useTabs, wrapLength, braceStyle, flags, language });
  optsRef.current = { indentSize, useTabs, wrapLength, braceStyle, flags, language };

  const toggleFlag = (key: string) => setFlags((f) => ({ ...f, [key]: !f[key] }));

  // Auto-run on input change (debounced 600ms)
  React.useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setViewMode("input");
      return;
    }
    const timer = setTimeout(() => {
      const { indentSize, useTabs, wrapLength, braceStyle, flags, language } = optsRef.current;
      if (lastOp === "minify") {
        const { result, error } = computeMinify(input, language);
        if (error) return;
        setOutput(result);
      } else {
        const { result, error } = computeBeautify(input, language, indentSize, useTabs, wrapLength, braceStyle, flags);
        if (error) return;
        setOutput(result);
      }
      setViewMode("output");
    }, 600);
    return () => clearTimeout(timer);
  }, [input, lastOp]);

  const handleBeautify = () => {
    if (!input.trim()) return;
    setLastOp("beautify");
    const { result, error } = computeBeautify(input, language, indentSize, useTabs, wrapLength, braceStyle, flags);
    if (error) {
      toast({ variant: "destructive", title: "Format error", description: error });
      return;
    }
    if (flags.detect_packers && /eval\s*\(function\(p,a,c,k,e/.test(input)) {
      toast({ title: "Packer detected", description: "Input may be packed/obfuscated.", variant: "destructive" });
    }
    setOutput(result);
    setViewMode("output");
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    setLastOp("minify");
    const { result, error } = computeMinify(input, language);
    if (error) {
      toast({ variant: "destructive", title: "Minify error", description: error });
      return;
    }
    setOutput(result);
    setViewMode("output");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setViewMode("input");
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied", description: "Output copied to clipboard." });
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = EXT_MAP[language] || "txt";
    downloadText(output, `compactify-output.${ext}`);
    toast({ title: "Downloaded", description: `Saved as compactify-output.${ext}` });
  };

  const handleSwapToInput = () => {
    setInput(output);
    setOutput("");
    setViewMode("input");
  };

  const outputStats = getStats(output);
  const inputStats = getStats(input);
  const highlightedOutput = React.useMemo(
    () => (output ? highlightCode(output, language) : ""),
    [output, language]
  );

  const visibleFlags = BOOL_OPTIONS.filter((o) => !o.langs || o.langs.includes(language));

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage} data-testid="select-language">
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Button data-testid="button-beautify" variant="default" size="sm" onClick={handleBeautify}>
              <Wand2 className="w-4 h-4 mr-1.5" /> Beautify
            </Button>
            <Button data-testid="button-minify" variant="secondary" size="sm" onClick={handleMinify}>
              <Minimize2 className="w-4 h-4 mr-1.5" /> Minify
            </Button>
          </div>
        </div>
        <Button data-testid="button-clear" variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 mr-1.5" /> Clear
        </Button>
      </div>

      {/* Options Panel — open by default */}
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen} className="border-b border-border bg-muted/10 shrink-0">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
            <span className="flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-wider">Options</span>
            </span>
            {optionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 bg-card border-t border-border">
            {/* Row 1: base formatting controls */}
            <div className="flex flex-wrap gap-5 items-center pb-3 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Indent</Label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                  <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="8">8 spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="use-tabs" checked={useTabs} onCheckedChange={setUseTabs} className="scale-75 origin-left" />
                <Label htmlFor="use-tabs" className="text-xs text-muted-foreground cursor-pointer">Use tabs</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Line wrap</Label>
                <Select value={wrapLength} onValueChange={setWrapLength}>
                  <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="80">80 chars</SelectItem>
                    <SelectItem value="100">100 chars</SelectItem>
                    <SelectItem value="120">120 chars</SelectItem>
                    <SelectItem value="160">160 chars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(language === "JavaScript" || language === "TypeScript") && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Braces</Label>
                  <Select value={braceStyle} onValueChange={setBraceStyle}>
                    <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collapse">Collapse</SelectItem>
                      <SelectItem value="expand">Expand</SelectItem>
                      <SelectItem value="end-expand">End-expand</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {/* Checkbox grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2.5">
              {visibleFlags.map((opt) => (
                <label key={opt.key} className="flex items-start gap-2 cursor-pointer group">
                  <Checkbox
                    id={`opt-${opt.key}`}
                    checked={!!flags[opt.key]}
                    onCheckedChange={() => toggleFlag(opt.key)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    data-testid={`checkbox-${opt.key}`}
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Main area — single full-width panel toggling between input/output */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === "input" ? (
          /* ── INPUT VIEW ── */
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input</span>
              <span className="text-xs text-muted-foreground font-mono">{inputStats.lines} lines · {inputStats.chars} chars</span>
            </div>
            <textarea
              data-testid="input-code"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 min-h-0 w-full p-4 font-mono text-sm bg-background border-none resize-none focus:outline-none text-foreground leading-relaxed"
              placeholder={`Paste ${language} code here — it will beautify automatically`}
              spellCheck={false}
              autoFocus
            />
          </div>
        ) : (
          /* ── OUTPUT VIEW ── */
          <div className="flex-1 min-h-0 flex flex-col" style={{ background: "var(--code-bg)" }}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  data-testid="button-back"
                  variant="ghost" size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={() => setViewMode("input")}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit
                </Button>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-l border-border pl-2">
                  Output
                  <span className="ml-2 font-normal normal-case">{lastOp === "minify" ? "— minified" : "— beautified"}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-mono mr-1">{outputStats.lines} lines · {outputStats.chars} chars</span>
                <Button
                  data-testid="button-use-as-input"
                  variant="outline" size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleSwapToInput}
                  title="Use output as new input"
                >
                  Re-edit
                </Button>
                <Button
                  data-testid="button-copy"
                  variant="outline" size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleCopy}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                </Button>
                <Button
                  data-testid="button-download"
                  variant="outline" size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              <pre className="p-4 font-mono text-sm leading-relaxed m-0 min-h-full">
                <code
                  className={`language-${LANG_PRISM_MAP[language] || "javascript"}`}
                  dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                />
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
