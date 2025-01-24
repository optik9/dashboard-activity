import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import "tailwindcss/tailwind.css";
import db from './firebaseConfig';

const countryFlags = {
  Perú: "🇵🇪",
  Ecuador: "🇪🇨",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Bolivia: "🇧🇴",
  Colombia: "🇨🇴",
  Chile: "🇨🇱",
  Paraguay: "🇵🇾",
  Uruguay: "🇺🇾",
  Venezuela: "🇻🇪",
  Mexico: "🇲🇽",
  Guatemala: "🇬🇹",
  Honduras: "🇭🇳",

  Nicaragua: "🇳🇮",

  Panama: "🇵🇦",
  Cuba: "🇨🇺",

  Haiti: "🇭🇹",
  USA: "🇺🇸",
  Canada: "🇨🇦",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
};

const EmployeeDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("All");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      const employeeData = [];
      const departmentSet = new Set(); // Para extraer departamentos únicos

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        employeeData.push({ id: doc.id, ...data });
        departmentSet.add(data.Department); // Agregar el departamento a un Set
      });

      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
      setDepartments(["All", ...Array.from(departmentSet)]); // Convertir Set a Array y agregar "All"
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (filter === "All") {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter((employee) => employee.Department === filter)
      );
    }
  }, [filter, employees]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Employees Outcode Peru</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <label htmlFor="department-filter" className="mb-2 md:mb-0 md:mr-4 font-medium">
          Filter by Department:
        </label>
        <select
          id="department-filter"
          className="p-2 border rounded shadow w-full md:w-1/3"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {departments.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full bg-white">
          <thead>
            <tr className="bg-blue-500 text-white text-sm uppercase">
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Start Date</th>
              <th className="p-4 text-left">Country</th>
              <th className="p-4 text-left">Position</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-left">Expense Center</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-100">
                <td className="p-4">{employee["Employee code"]}</td>
                <td className="p-4">{employee.User}</td>
                <td className="p-4">{new Date((employee["Start date"] - 25569) * 86400 * 1000).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className="mr-2">{countryFlags[employee.Country] || "🏳️"}</span>
                  {employee.Country}
                </td>
                <td className="p-4">{employee.Position}</td>
                <td className="p-4">{employee.Department}</td>
                <td className="p-4">{employee["Expense Center"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <p className="text-center mt-4 text-gray-600">No employees found for this department.</p>
      )}
    </div>
  );
};

export default EmployeeDashboard;