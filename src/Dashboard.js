import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import "tailwindcss/tailwind.css";
import db from './firebaseConfig';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const countryFlags = {
  Peru: "🇵🇪",
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
  const [timeInCompanyData, setTimeInCompanyData] = useState([]);
  const [contractTypeData, setContractTypeData] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      const employeeData = [];
      const departmentSet = new Set();
      const contractTypes = new Map();
      const timeRanges = new Map();
      const currentDate = new Date();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        employeeData.push({ id: doc.id, ...data });
        departmentSet.add(data.Department);
        
        // Count contract types
        const type = data.Type || 'Unspecified';
        contractTypes.set(type, (contractTypes.get(type) || 0) + 1);

        // Calculate time in company
        const startDate = new Date((data["Start date"] - 25569) * 86400 * 1000);
        const yearsInCompany = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 365));
        
        let range;
        if (yearsInCompany < 1) {
          range = "< 1 year";
        } else if (yearsInCompany < 2) {
          range = "1-2 years";
        } else if (yearsInCompany < 3) {
          range = "2-3 years";
        } else if (yearsInCompany < 5) {
          range = "3-5 years";
        } else {
          range = "5+ years";
        }
        
        timeRanges.set(range, (timeRanges.get(range) || 0) + 1);
      });

      // Sort employees alphabetically by User
      const sortedEmployees = employeeData.sort((a, b) => 
        a.User.localeCompare(b.User)
      );

      // Convert Maps to arrays for Recharts
      const timeData = Array.from(timeRanges).map(([range, count]) => ({
        range,
        count
      }));

      const contractData = Array.from(contractTypes).map(([type, count]) => ({
        type,
        count
      }));

      setEmployees(sortedEmployees);
      setFilteredEmployees(sortedEmployees);
      setDepartments(["All", ...Array.from(departmentSet)]);
      setTimeInCompanyData(timeData);
      setContractTypeData(contractData);
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
      
      {/* Metrics Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Time in Company Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Employee Tenure Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeInCompanyData}>
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Type Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contract Type Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contractTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {contractTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Filter */}
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

      {/* Employee Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full bg-white">
          <thead>
            <tr className="bg-blue-500 text-white text-sm uppercase">
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Start Date</th>
              <th className="p-4 text-left">Country</th>
              <th className="p-4 text-left">Position</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-left">Expense Center</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr key={employee.id} className="hover:bg-gray-100">
                <td className="p-4">{index + 1}</td>
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