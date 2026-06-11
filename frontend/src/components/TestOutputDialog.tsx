import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
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
        <Button
          className="w-full"
          onClick={() => navigator.clipboard.writeText(content)}
        >
          Copy
        </Button>
      </DialogContent>
    </Dialog>
  );
}
