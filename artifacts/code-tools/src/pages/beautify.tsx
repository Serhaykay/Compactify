import * as React from "react";
import js_beautify from "js-beautify";
import { Wand2, Minimize2, Copy, Trash2, ArrowUpFromLine, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = ["JavaScript", "TypeScript", "HTML", "CSS", "JSON"];

export default function BeautifyPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [language, setLanguage] = React.useState("JavaScript");
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  
  // Beautify Options
  const [indentSize, setIndentSize] = React.useState("2");
  const [useTabs, setUseTabs] = React.useState(false);
  
  const { toast } = useToast();

  const getStats = (text: string) => {
    return {
      chars: text.length,
      lines: text ? text.split("\n").length : 0
    };
  };

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  const handleBeautify = () => {
    if (!input.trim()) return;
    
    try {
      let result = "";
      const opts = {
        indent_size: parseInt(indentSize),
        indent_with_tabs: useTabs,
      };

      if (language === "JSON") {
        result = JSON.stringify(JSON.parse(input), null, useTabs ? '\t' : parseInt(indentSize));
      } else if (language === "HTML") {
        result = js_beautify.html_beautify(input, opts);
      } else if (language === "CSS") {
        result = js_beautify.css_beautify(input, opts);
      } else {
        // JS/TS
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
        // Simple CSS minifier
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
          .replace(/\s+/g, ' ') // collapse whitespace
          .replace(/\s*([\{\}\:\;\,])\s*/g, '$1') // remove spaces around symbols
          .replace(/;\}/g, '}') // remove trailing semicolon
          .trim();
      } else if (language === "HTML") {
        // Simple HTML minifier
        result = input
          .replace(/<!--[\s\S]*?-->/g, '') // remove comments
          .replace(/\>\s+\</g, '><') // remove spaces between tags
          .trim();
      } else {
        // Simple JS minifier (very basic)
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
          .replace(/\/\/.*/g, '') // remove single-line comments
          .replace(/\s+/g, ' ') // collapse whitespace
          .replace(/\s*([\{\}\(\)\[\]\:\;\,\.\=\+\-\*\/\%\!\&\<>\?\|])\s*/g, '$1') // remove spaces around operators
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

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  const handleSwap = () => {
    if (output) {
      setInput(output);
      setOutput("");
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Output code has been copied.",
      });
    }
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
          
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <Button variant="default" size="sm" onClick={handleBeautify} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Wand2 className="w-4 h-4 mr-2" />
              Beautify
            </Button>
            <Button variant="secondary" size="sm" onClick={handleMinify}>
              <Minimize2 className="w-4 h-4 mr-2" />
              Minify
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
      
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen} className="border-b border-border bg-muted/30">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full rounded-none justify-between text-xs text-muted-foreground hover:text-foreground h-8">
            <span className="flex items-center">
              <Settings2 className="w-3 h-3 mr-2" />
              Format Options
            </span>
            {optionsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 flex gap-8 items-center bg-card text-sm">
          <div className="flex items-center gap-3">
            <Label htmlFor="indent-size" className="text-muted-foreground text-xs uppercase tracking-wider">Indent Size</Label>
            <Select value={indentSize} onValueChange={setIndentSize}>
              <SelectTrigger id="indent-size" className="w-24 h-8">
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

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Input Pane */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-background relative">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
             <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input</div>
             <div className="text-xs text-muted-foreground font-mono">
                {inputStats.lines} lines | {inputStats.chars} chars
             </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full flex-1 p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-foreground"
            placeholder={`Paste ${language} code here...`}
            spellCheck={false}
          />
        </div>
        
        {/* Output Pane */}
        <div className="flex-1 flex flex-col bg-[#0d1017] relative">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
             <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output</div>
             <div className="flex items-center gap-4">
               <div className="text-xs text-muted-foreground font-mono">
                  {outputStats.lines} lines | {outputStats.chars} chars
               </div>
               <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleSwap} title="Move to Input">
                   <ArrowUpFromLine className="w-3.5 h-3.5" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy Output">
                   <Copy className="w-3.5 h-3.5" />
                 </Button>
               </div>
             </div>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full flex-1 p-4 font-mono text-sm bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-primary-foreground selection:bg-primary/30"
            placeholder="Result will appear here..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
