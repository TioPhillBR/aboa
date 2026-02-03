import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  showTime?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  disabled = false,
  minDate,
  maxDate,
  className,
  showTime = false,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [timeValue, setTimeValue] = React.useState("12:00");

  // Sync input value with prop value
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"));
      if (showTime) {
        setTimeValue(format(value, "HH:mm"));
      }
    } else {
      setInputValue("");
    }
  }, [value, showTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    
    // Auto-format as user types
    if (rawValue.length >= 2) {
      rawValue = rawValue.slice(0, 2) + "/" + rawValue.slice(2);
    }
    if (rawValue.length >= 5) {
      rawValue = rawValue.slice(0, 5) + "/" + rawValue.slice(5, 9);
    }
    
    setInputValue(rawValue);

    // Parse complete date
    if (rawValue.length === 10) {
      const parsed = parse(rawValue, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        // Validate against min/max
        if (minDate && parsed < minDate) return;
        if (maxDate && parsed > maxDate) return;
        
        if (showTime && timeValue) {
          const [hours, minutes] = timeValue.split(":").map(Number);
          parsed.setHours(hours, minutes, 0, 0);
        }
        
        onChange(parsed);
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (value && isValid(value) && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      if (showTime && timeValue) {
        const [hours, minutes] = timeValue.split(":").map(Number);
        date.setHours(hours, minutes, 0, 0);
      }
      onChange(date);
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys, backspace, delete
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    const isNumber = /^\d$/.test(e.key);
    
    if (!isNumber && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          maxLength={10}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              disabled={disabled}
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              locale={ptBR}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {showTime && (
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={disabled}
          className="w-28"
        />
      )}
    </div>
  );
}

// Variant for date range
interface DateRangePickerInputProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from: Date; to: Date } | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function DateRangePickerInput({
  from,
  to,
  onChange,
  disabled = false,
  className,
}: DateRangePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const [fromInput, setFromInput] = React.useState("");
  const [toInput, setToInput] = React.useState("");

  React.useEffect(() => {
    if (from && isValid(from)) {
      setFromInput(format(from, "dd/MM/yyyy"));
    }
    if (to && isValid(to)) {
      setToInput(format(to, "dd/MM/yyyy"));
    }
  }, [from, to]);

  const formatInput = (value: string) => {
    let rawValue = value.replace(/\D/g, "");
    if (rawValue.length >= 2) {
      rawValue = rawValue.slice(0, 2) + "/" + rawValue.slice(2);
    }
    if (rawValue.length >= 5) {
      rawValue = rawValue.slice(0, 5) + "/" + rawValue.slice(5, 9);
    }
    return rawValue;
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInput(e.target.value);
    setFromInput(formatted);

    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed) && to) {
        onChange({ from: parsed, to });
      }
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInput(e.target.value);
    setToInput(formatted);

    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed) && from) {
        onChange({ from, to: parsed });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    const isNumber = /^\d$/.test(e.key);
    
    if (!isNumber && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        value={fromInput}
        onChange={handleFromChange}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM/AAAA"
        disabled={disabled}
        className="w-32"
        maxLength={10}
      />
      <span className="text-muted-foreground">—</span>
      <Input
        value={toInput}
        onChange={handleToChange}
        onKeyDown={handleKeyDown}
        placeholder="DD/MM/AAAA"
        disabled={disabled}
        className="w-32"
        maxLength={10}
      />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" type="button" disabled={disabled}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from, to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange({ from: range.from, to: range.to });
                setOpen(false);
              }
            }}
            locale={ptBR}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
