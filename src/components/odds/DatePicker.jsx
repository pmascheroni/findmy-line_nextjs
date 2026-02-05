import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";

export default function DatePicker({ date, selectedDate, onDateChange }) {
  const [open, setOpen] = useState(false);
  const currentDate = date || selectedDate || new Date();

  const getDateLabel = (d) => {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateChange(subDays(currentDate, 1))}
        className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[140px] justify-start text-left font-medium bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-white"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
            <span>{getDateLabel(currentDate)}</span>
            <span className="ml-1 text-slate-500 text-xs">
              {!isToday(currentDate) && !isTomorrow(currentDate) && !isYesterday(currentDate) ? "" : format(currentDate, "MMM d")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(d) => {
              if (d) {
                onDateChange(d);
                setOpen(false);
              }
            }}
            initialFocus
            className="bg-slate-900 text-white"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDateChange(addDays(currentDate, 1))}
        className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isToday(currentDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          Today
        </Button>
      )}
    </div>
  );
}
