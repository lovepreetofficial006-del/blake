import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Calendar, CalendarCheck, ChevronDown, ChevronUp, X } from "lucide-react"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react"
import TimeDropdown from "./TimeDropdown"
import RecurringNew from "./Recurring"
import type { AppDispatch, RootState } from "../../Redux/Store"
import { useDispatch, useSelector } from "react-redux"
import { UpdateTaskAPI } from "../../Services/API/Put"
import { fetchData } from "../../Redux/Slice/TaskSlice"

interface DatePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  startTime?: string
  endTime?: string
  onStartTimeChange?: (time: string) => void
  onEndTimeChange?: (time: string) => void
  showStartTime?: boolean
  showEndTime?: boolean
  onShowStartTimeChange?: (show: boolean) => void
  onShowEndTimeChange?: (show: boolean) => void
  className?: string
  onClose?: () => void
  isSubtask?: boolean
  handleClearDate?: () => void
  taskId?: string | null
  subtaskId?: string | null
  setMessage: React.Dispatch<React.SetStateAction<string>>
}

export const DatePicker: React.FC<DatePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startTime = "",
  endTime = "",
  onStartTimeChange,
  onEndTimeChange,
  showStartTime = false,
  showEndTime = false,
  onShowStartTimeChange,
  onShowEndTimeChange,
  className = "",
  onClose,
  isSubtask,
  taskId,
  subtaskId,
  setMessage,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const [isOpen, setIsOpen] = useState(false)
  const [startDateInput, setStartDateInput] = useState(formatDateInputValue(startDate))
  const [endDateInput, setEndDateInput] = useState(formatDateInputValue(endDate))
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectionMode, setSelectionMode] = useState<"start" | "end" | null>("start")
  const [dateValidationError, setDateValidationError] = useState("")
  const [isStartTimeDropdownOpen, setIsStartTimeDropdownOpen] = useState(false)
  const [isEndTimeDropdownOpen, setIsEndTimeDropdownOpen] = useState(false)
  const [localStartTime, setLocalStartTime] = useState(startTime)
  const [localEndTime, setLocalEndTime] = useState(endTime)
  const [localShowStartTime, setLocalShowStartTime] = useState(showStartTime)
  const [localShowEndTime, setLocalShowEndTime] = useState(showEndTime)
  const [isHovered, setIsHovered] = useState(false)
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)
  const startTimeDropdownRef = useRef<HTMLDivElement>(null)
  const endTimeDropdownRef = useRef<HTMLDivElement>(null)
  const selectedIds = useSelector((state: RootState) => state.selectedIds)
  const [recurringFrequency, setRecurringFrequency] = useState("")
  const [recurringDates, setRecurringDates] = useState<Date[]>([]);

  const [customInterval, setCustomInterval] = useState(1)
  const [customPeriod, setCustomPeriod] = useState("week")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [skipWeekends, setSkipWeekends] = useState(false)
  const [monthlyOption, setMonthlyOption] = useState("Same day each month")
  console.log("customInterval", customInterval)
  console.log("selectedDays", selectedDays)
  console.log("skipWeekends", skipWeekends)
  console.log("monthlyOption", monthlyOption)
  console.log("customPeriod", customPeriod)

  const today = new Date()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startTimeDropdownRef.current && !startTimeDropdownRef.current.contains(event.target as Node)) {
        setIsStartTimeDropdownOpen(false)
        if (!localStartTime) {
          setLocalShowStartTime(false)
        }
      }
      if (endTimeDropdownRef.current && !endTimeDropdownRef.current.contains(event.target as Node)) {
        setIsEndTimeDropdownOpen(false)
        if (!localEndTime) {
          setLocalShowEndTime(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [localStartTime, localEndTime])

  useEffect(() => {
    setStartDateInput(formatDateInputValue(startDate))
  }, [startDate])

  useEffect(() => {
    setEndDateInput(formatDateInputValue(endDate))
  }, [endDate])

  useEffect(() => {
    setLocalStartTime(startTime)
  }, [startTime])

  useEffect(() => {
    setLocalEndTime(endTime)
  }, [endTime])

  function formatDateInputValue(date: Date | null): string {
    if (!date) return ""
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  }

  function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null
    const parts = dateStr.split("/")
    if (parts.length === 3) {
      const month = Number.parseInt(parts[0]) - 1
      const day = Number.parseInt(parts[1])
      const year = Number.parseInt(parts[2])
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        const date = new Date(year, month, day)
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date
        }
      }
    }
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  function validateDates(start: Date | null, end: Date | null): boolean {
    if (start && end && start > end) {
      setDateValidationError("Start date cannot be after due date")
      return false
    }
    setDateValidationError("")
    return true
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDateInput(value)
    const parsedDate = parseDate(value)
    if (parsedDate) {
      onStartDateChange(parsedDate)
      validateDates(parsedDate, endDate)
    } else if (value === "") {
      onStartDateChange(null)
      setDateValidationError("")
    } else {
      setDateValidationError("Invalid start date format. Use MM/DD/YYYY")
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndDateInput(value)
    const parsedDate = parseDate(value)
    if (parsedDate) {
      onEndDateChange(parsedDate)
      validateDates(startDate, parsedDate)
    } else if (value === "") {
      onEndDateChange(null)
      setDateValidationError("")
    } else {
      setDateValidationError("Invalid due date format. Use MM/DD/YYYY")
    }
  }

  // Function to check if a date should be selected based on custom period and interval
  const shouldSelectDate = (date: Date): boolean => {
    if (!recurringFrequency || recurringFrequency === "None") {
      return false
    }

    // If custom period is not set, return false
    if (!customPeriod) {
      return false
    }

    const baseDate = startDate || endDate || new Date()
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (customPeriod) {
      case "day":
        // Select every nth day based on customInterval
        return daysDiff % customInterval === 0

      case "week":
        // Select every nth week based on customInterval
        const weeksDiff = Math.floor(daysDiff / 7)
        return weeksDiff % customInterval === 0

      case "month":
        // Select every nth month based on customInterval
        const monthsDiff = (date.getFullYear() - baseDate.getFullYear()) * 12 + 
                          (date.getMonth() - baseDate.getMonth())
        return monthsDiff % customInterval === 0

      case "year":
        // Select every nth year based on customInterval
        const yearsDiff = date.getFullYear() - baseDate.getFullYear()
        return yearsDiff % customInterval === 0

      default:
        return false
    }
  }

  // Function to check if a date should be skipped based on custom interval
  const shouldSkipDate = (date: Date): boolean => {
    if (!recurringFrequency || recurringFrequency === "None") {
      return false
    }

    if (customInterval <= 1) {
      return false
    }

    const baseDate = startDate || endDate || new Date()
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (customPeriod) {
      case "day":
        // Skip days that don't match the interval pattern
        return daysDiff % customInterval !== 0

      case "week":
        // Skip weeks that don't match the interval pattern
        const weeksDiff = Math.floor(daysDiff / 7)
        return weeksDiff % customInterval !== 0

      case "month":
        // Skip months that don't match the interval pattern
        const monthsDiff = (date.getFullYear() - baseDate.getFullYear()) * 12 + 
                          (date.getMonth() - baseDate.getMonth())
        return monthsDiff % customInterval !== 0

      case "year":
        // Skip years that don't match the interval pattern
        const yearsDiff = date.getFullYear() - baseDate.getFullYear()
        return yearsDiff % customInterval !== 0

      default:
        return false
    }
  }

  const handleDateSelection = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day)

    if (selectionMode === "end") {
      onEndDateChange(selectedDate)
      setEndDateInput(formatDateInputValue(selectedDate))

      if (!startDate) {
        const today = new Date()
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        onStartDateChange(todayDate)
        setStartDateInput(formatDateInputValue(todayDate))
      }

      if (startDate && selectedDate < startDate) {
        setDateValidationError("Due date cannot be before start date")
      } else {
        validateDates(startDate, selectedDate)
      }
    } else if (selectionMode === "start") {
      onStartDateChange(selectedDate)
      setStartDateInput(formatDateInputValue(selectedDate))
      validateDates(selectedDate, endDate)
    }
  }

  const openDatePicker = (mode: "start" | "end") => {
    setSelectionMode(mode)
    setIsOpen(true)

    if (mode === "start" && startDate) {
      setCurrentMonth(new Date(startDate))
    } else if (mode === "end" && endDate) {
      setCurrentMonth(new Date(endDate))
    } else {
      setCurrentMonth(new Date())
    }
  }

  const handleApply = () => {
    if (!recurringFrequency || recurringFrequency === "None") {
      if (!endDate) {
        setDateValidationError("End date is required")
        return
      }
      if (startDate && !endDate) {
        setDateValidationError("Due date is required")
        return
      }
    } else {
      if (recurringFrequency === "Yearly") {
        if (!startDate) {
          setDateValidationError("Start date is required for yearly recurrence")
          return
        }
      }
    }

    if (onStartTimeChange) {
      onStartTimeChange(startDate ? localStartTime || "" : "")
    }

    if (onEndTimeChange) {
      onEndTimeChange(endDate ? localEndTime || "" : "")
    }

    if (onShowStartTimeChange) {
      onShowStartTimeChange(!!(startDate && localStartTime))
    }

    if (onShowEndTimeChange) {
      onShowEndTimeChange(!!(endDate && localEndTime))
    }

    setDateValidationError("")
    onClose?.()
    setIsOpen(false)
  }

  const handleRecurringDateSelect = (nextDate: Date) => {
    let baseDate: Date;
    if (endDate) {
      baseDate = new Date(endDate);
    } else if (startDate) {
      baseDate = new Date(startDate);
    } else {
      const today = new Date();
      baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    if (recurringFrequency && recurringFrequency !== "None") {
      const base = endDate || startDate || new Date();
      const recDates = generateRecurringDates(base, recurringFrequency);
      setRecurringDates(recDates);
    }

    setRecurringDates((prev) =>
      prev.some((d) => d.getTime() === nextDate.getTime())
        ? prev
        : [...prev, nextDate]
    );
    setDateValidationError("");
  };

  function generateRecurringDates(start: Date, frequency: string): Date[] {
    const dates: Date[] = []
    const endLimit = new Date()
    endLimit.setFullYear(endLimit.getFullYear() + 10)

    let current = new Date(start)
    while (current <= endLimit) {
      dates.push(new Date(current))

      if (frequency === "Daily") {
        current.setDate(current.getDate() + 1)
      } else if (frequency === "Weekly") {
        current.setDate(current.getDate() + 7)
      } else if (frequency === "Monthly") {
        current.setMonth(current.getMonth() + 1)
      } else if (frequency === "Yearly") {
        current.setFullYear(current.getFullYear() + 1)
      } else {
        break
      }
    }

    return dates
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startingDay = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = []
    const prevMonth = new Date(year, month, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: daysInPrevMonth - i,
        month: month - 1 < 0 ? 11 : month - 1,
        year: month - 1 < 0 ? year - 1 : year,
        isCurrentMonth: false,
      })
    }
    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      })
    }
    const nextMonthDays = []
    const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length
    const daysToAdd = 42 - totalDaysDisplayed
    for (let i = 1; i <= daysToAdd; i++) {
      nextMonthDays.push({
        day: i,
        month: month + 1 > 11 ? 0 : month + 1,
        year: month + 1 > 11 ? year + 1 : year,
        isCurrentMonth: false,
      })
    }
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const getFormattedDateDisplay = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const formatDateWithTime = (date: Date, time?: string) => {
      const isToday = date.toDateString() === today.toDateString()
      const isTomorrow = date.toDateString() === tomorrow.toDateString()

      if (isToday) {
        return time ? `Today, ${time}` : "Today"
      }
      if (isTomorrow) {
        return time ? `Tomorrow, ${time}` : "Tomorrow"
      }

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const month = months[date.getMonth()]
      const day = date.getDate()
      return time ? `${month} ${day}, ${time}` : `${month} ${day}`
    }

    if (endDate) {
      return formatDateWithTime(endDate, localShowEndTime ? localEndTime : undefined)
    }

    if (startDate && !endDate) {
      return formatDateWithTime(startDate, localShowStartTime ? localStartTime : undefined)
    }
    return "Set dates"
  }

  const isEndDateInPast = () => {
    if (!endDate) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    return end < today
  }

  const handleStartTimeSelect = (time: string) => {
    setLocalStartTime(time)
    setLocalShowStartTime(true)
    setIsStartTimeDropdownOpen(false)
  }

  const handleEndTimeSelect = (time: string) => {
    setLocalEndTime(time)
    setLocalShowEndTime(true)
    setIsEndTimeDropdownOpen(false)
  }

  const handleStartTimeClose = () => {
    setIsStartTimeDropdownOpen(false)
    if (!localStartTime) {
      setLocalShowStartTime(false)
    }
  }

  const handleEndTimeClose = () => {
    setIsEndTimeDropdownOpen(false)
    if (!localEndTime) {
      setLocalShowEndTime(false)
    }
  }

  const clearAllDates = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartDateChange(null)
    onEndDateChange(null)
    setStartDateInput("")
    setEndDateInput("")
    setDateValidationError("")
    setLocalShowStartTime(false)
    setLocalShowEndTime(false)
    onStartTimeChange?.("")
    onEndTimeChange?.("")
    onShowStartTimeChange?.(false)
    onShowEndTimeChange?.(false)
    setLocalStartTime("")
    setLocalEndTime("")

    try {
      const updateData: any = {
        id: taskId || subtaskId,
        listId: selectedIds?.listId || null,
        dueDate: {
          startDate: null,
          endDate: null,
          startTime: null,
          endTime: null,
        },
      }

      const res = await UpdateTaskAPI({ formData: updateData })
      await dispatch(fetchData(selectedIds?.listId || null))
      if (res?.success === true) {
        setMessage(res?.message || "Due date clear successfully")
      } else {
        setMessage(res?.message || "Something went wrong")
      }
    } catch (e) {
      if (e instanceof Error) {
        setMessage(e.message)
      } else {
        setMessage("Internal server errro")
      }
    }
  }

  return (
    <div className={`${className} w-full`}>
      <Dropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom"
        classNames={{
          content: `p-2 bg-white border border-gray-200 rounded-md shadow-xl ${isSubtask ? "w-[530px] md:w-[540px]" : "w-[530px] md:w-[540px]"
            } h-[430px]`,
        }}
        shouldBlockScroll={true}
      >
        <DropdownTrigger>
          <button
            className="flex items-center justify-between text-gray-600 border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-[#fff] w-full min-h-[40px] md:min-h-[30px] md:max-h-[30px] group"
            onClick={() => {
              setSelectionMode("start")
              setCurrentMonth(new Date())
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center">
              <Calendar className={`h-4 w-4 mr-1 ${isEndDateInPast() ? "text-red-500" : "text-gray-600"}`} />
              <span className={`text-[12px] ${isEndDateInPast() ? "text-red-500" : "text-gray-600"}`}>
                {getFormattedDateDisplay()}
              </span>
            </div>
            {isHovered && (startDate || endDate) && (
              <span
                role="button"
                tabIndex={0}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                onClick={clearAllDates}
              >
                <X size={16} />
              </span>
            )}
          </button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Date picker"
          className="p-0"
          itemClasses={{
            base: "p-0 m-0",
          }}
        >
          <DropdownItem className="p-0 m-0" isReadOnly key={""} textValue="date-picker">
            <div className="w-full p-2 max-w-full top-0 min-w-[310px] md:left-auto md:top-0 md:min-w-0 md:max-w-full cursor-text">
              <div className="flex w-full gap-4">
                <div className="flex flex-col w-[250px]">
                  <div
                    className={`flex items-center bg-white border relative ${selectionMode === "start" ? "border-2 border-[#3B82F6]" : "border-gray-300"
                      } rounded-md pl-2 h-10 mb-1`}
                  >
                    <CalendarCheck className="w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Start date"
                      value={startDateInput}
                      onChange={handleStartDateChange}
                      onClick={() => openDatePicker("start")}
                      ref={startDateInputRef}
                      className="relative ml-2 outline-none border-none focus:ring-0 text-sm placeholder-gray-400 flex-1"
                    />
                    {startDateInput && (
                      <button
                        className="absolute text-gray-400 left-[105px] hover:text-gray-600 p-1 mr-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onStartDateChange(null)
                          setStartDateInput("")
                          setDateValidationError("")
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                    {startDate && (
                      <div className="absolute right-0" ref={startTimeDropdownRef}>
                        {localStartTime ? (
                          <div className="flex items-center text-xs text-gray-600 ml-1">
                            <button
                              className="hover:text-gray-800 mr-[-13px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsStartTimeDropdownOpen(true)
                              }}
                            >
                              {localStartTime}
                            </button>
                            <button
                              className="text-gray-400 hover:text-gray-600 text-sm p-1.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLocalShowStartTime(false)
                                setLocalStartTime("")
                              }}
                            >
                              <X className="text-gray-500" size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap ml-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsStartTimeDropdownOpen((prev) => !prev)
                              if (!isStartTimeDropdownOpen) {
                                setLocalShowStartTime(true)
                              }
                            }}
                          >
                            Add time
                          </button>
                        )}
                        {localShowStartTime && isStartTimeDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 z-50">
                            <TimeDropdown
                              isOpen={isStartTimeDropdownOpen}
                              onSelect={handleStartTimeSelect}
                              onClose={handleStartTimeClose}
                            />
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                <div className="flex flex-col w-[250px]">
                  <div
                    className={`flex items-center bg-white border relative ${selectionMode === "end" ? "border-2 border-[#3B82F6]" : "border-gray-300"
                      } rounded-md pl-2 h-10 mb-1`}
                  >
                    <CalendarCheck className="w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Due date"
                      value={endDateInput}
                      onChange={handleEndDateChange}
                      onClick={() => openDatePicker("end")}
                      ref={endDateInputRef}
                      className="relative ml-2 outline-none border-none focus:ring-0 text-sm placeholder-gray-400 flex-1"
                    />
                    {endDateInput && (
                      <button
                        className="absolute text-gray-400 left-[100px] hover:text-gray-600 p-1 mr-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEndDateChange(null)
                          setEndDateInput("")
                          setDateValidationError("")
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                    {endDate && (
                      <div className="absolute right-0" ref={endTimeDropdownRef}>
                        {localEndTime ? (
                          <div className="flex items-center text-xs text-gray-600 ">
                            <button
                              className="hover:text-gray-800 mr-[-13px]"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsEndTimeDropdownOpen(true)
                              }}
                            >
                              {localEndTime}
                            </button>
                            <button
                              className="text-gray-400 hover:text-gray-600 p-1.5"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLocalShowEndTime(false)
                                setLocalEndTime("")
                              }}
                            >
                              <X className="text-gray-500" size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap ml-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsEndTimeDropdownOpen((prev) => !prev)
                              if (!isEndTimeDropdownOpen) {
                                setLocalShowEndTime(true)
                              }
                            }}
                          >
                            Add time
                          </button>
                        )}
                        {localShowEndTime && isEndTimeDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 z-50">
                            <TimeDropdown
                              isOpen={isEndTimeDropdownOpen}
                              onSelect={handleEndTimeSelect}
                              onClose={handleEndTimeClose}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {dateValidationError && <div className="text-red-500 text-xs mt-1">{dateValidationError}</div>}
              <div className="flex border-t border-gray-200 mt-4">
                <RecurringNew
                  onDateSelect={handleRecurringDateSelect}
                  setRecurringFrequency={setRecurringFrequency}
                  recurringFrequency={recurringFrequency}
                  setRecurringDates={setRecurringDates}
                  customInterval={customInterval}
                  setCustomInterval={setCustomInterval}
                  customPeriod={customPeriod}
                  setCustomPeriod={setCustomPeriod}
                  selectedDays={selectedDays}
                  setSelectedDays={setSelectedDays}
                  skipWeekends={skipWeekends}
                  setSkipWeekends={setSkipWeekends}
                  monthlyOption={monthlyOption}
                  setMonthlyOption={setMonthlyOption}
                />
                <div className="flex-1 p-3">
                  <div className="flex justify-between items-center p-2">
                    <div className="text-sm font-medium">{getMonthName(currentMonth)}</div>
                    <div className="flex items-center">
                      <button
                        className="p-1 hover:bg-gray-200 rounded-md"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                        }
                      >
                        <ChevronUp />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-200 rounded-md ml-1"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                        }
                      >
                        <ChevronDown />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="text-center text-xs text-gray-900 py-1">
                        {day}
                      </div>
                    ))}
                    {generateCalendarDays().map((day, index) => {
                      const currentDate = new Date(day.year, day.month, day.day)
                      const isStartDate =
                        startDate &&
                        startDate.getDate() === day.day &&
                        startDate.getMonth() === day.month &&
                        startDate.getFullYear() === day.year
                      const isEndDate =
                        endDate &&
                        endDate.getDate() === day.day &&
                        endDate.getMonth() === day.month &&
                        endDate.getFullYear() === day.year
                      const isToday =
                        today.getDate() === day.day &&
                        today.getMonth() === day.month &&
                        today.getFullYear() === day.year
                      const isInRange =
                        startDate &&
                        endDate &&
                        new Date(day.year, day.month, day.day) > startDate &&
                        new Date(day.year, day.month, day.day) < endDate
                      const isRecurring =
                        recurringDates.some(
                          (rd) =>
                            rd.getDate() === day.day &&
                            rd.getMonth() === day.month &&
                            rd.getFullYear() === day.year
                        )
                      
                      // Check if date should be selected based on custom period logic
                      const isCustomSelected = shouldSelectDate(currentDate)
                      const isCustomSkipped = shouldSkipDate(currentDate)

                      return (
                        <button
                          key={index}
                          className={`
    text-center py-1 text-sm rounded-full w-3 h-6 p-3 mx-auto flex items-center justify-center
    ${day.isCurrentMonth ? "" : "text-gray-400"}
    ${isStartDate ? "bg-[#3B82F6] text-white" : ""}
    ${isEndDate ? "bg-[#3B82F6] text-white" : ""}
    ${isInRange ? "bg-[#a8bcdd] text-white" : ""}
    ${isRecurring ? "bg-[#3B82F6] text-white" : ""}  
    ${isCustomSelected ? "bg-[#10B981] text-white" : ""}
    ${isCustomSkipped ? "bg-gray-100 text-gray-400" : ""}
    ${isToday && !isStartDate && !isEndDate && !isCustomSelected ? "border text-[#3B82F6] border-[#3B82F6]" : ""}
    ${!isStartDate && !isEndDate && !isInRange && !isRecurring && !isCustomSelected && !isCustomSkipped ? "hover:bg-gray-200" : ""}
  `}
                          onClick={() => handleDateSelection(day.day, day.month, day.year)}
                        >
                          <span>{day.day}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex justify-end mt-4">
                    <div>
                      <button
                        className="px-3 py-1 text-[#F97316] border border-[#F97316] hover:bg-[#F97316] hover:text-white rounded text-sm mr-2"
                        onClick={clearAllDates}
                      >
                        Clear
                      </button>
                      <button className="px-3 py-1 bg-[#3B82F6] text-white rounded text-sm" onClick={handleApply}>
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}