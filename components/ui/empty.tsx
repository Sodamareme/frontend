import { FileQuestion } from "lucide-react";

interface EmptyProps {
  label: string;
}

export const Empty = ({
  label
}: EmptyProps) => {
  return (
    <div className="h-full p-20 flex flex-col items-center justify-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground text-sm text-center mt-2">
        {label}
      </p>
    </div>
  );
};