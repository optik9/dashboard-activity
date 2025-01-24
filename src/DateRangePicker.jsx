import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateRangePicker = ({ onChange }) => {
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);

  // Normalizar fecha al inicio del día (sin errores de zonas horarias)
  const setStartOfDayUTC = (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC
    return newDate;
  };

  // Normalizar fecha al final del día (sin errores de zonas horarias)
  const setEndOfDayUTC = (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setUTCHours(23, 59, 59, 999); // Final del día en UTC
    return newDate;
  };

  const handleStartDateChange = (date) => {
    const adjustedStartDate = setStartOfDayUTC(date);
    setStartDate(adjustedStartDate);

    onChange({
      startDate: adjustedStartDate,
      endDate: endDate ? setEndOfDayUTC(endDate) : null,
    });
  };

  const handleEndDateChange = (date) => {
    const adjustedEndDate = setEndOfDayUTC(date);
    setEndDate(adjustedEndDate);

    onChange({
      startDate: startDate ? setStartOfDayUTC(startDate) : null,
      endDate: adjustedEndDate,
    });
  };

  return (
    <div className="flex space-x-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate} // Evita seleccionar fechas finales antes del inicio
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;