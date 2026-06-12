import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

type Props = {
  open: boolean;
  content: string;
  onOpenChange: (open: boolean) => void;
};

export function TestOutputDialog({ content, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Playwright Test</DialogTitle>
        </DialogHeader>
        <Textarea
          readOnly
          value={content}
          className="h-96 font-mono text-xs resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={() => navigator.clipboard.writeText(content)}>
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
